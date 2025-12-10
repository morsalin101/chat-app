export interface CallOffer {
    type: 'offer';
    offer: RTCSessionDescriptionInit;
    from: string;
    to: string;
    callType: 'voice' | 'video';
}

export interface CallAnswer {
    type: 'answer';
    answer: RTCSessionDescriptionInit;
    from: string;
    to: string;
}

export interface ICECandidate {
    type: 'ice-candidate';
    candidate: RTCIceCandidateInit;
    from: string;
    to: string;
}

export interface CallReject {
    type: 'reject';
    from: string;
    to: string;
}

export interface CallAccepted {
    type: 'accepted';
    from: string;
    to: string;
}

export interface CallEnd {
    type: 'end';
    from: string;
    to: string;
}

export type CallSignal = CallOffer | CallAnswer | ICECandidate | CallReject | CallEnd | CallAccepted;

export class WebRTCHandler {
    private peerConnection: RTCPeerConnection | null = null;
    private localStream: MediaStream | null = null;
    private remoteStream: MediaStream | null = null;
    private onRemoteStream: ((stream: MediaStream) => void) | null = null;
    private onCallEnd: (() => void) | null = null;
    private iceCandidateQueue: RTCIceCandidateInit[] = [];
    private remoteDescriptionSet: boolean = false;
    public pendingOffer?: RTCSessionDescriptionInit;

    constructor(
        private userId: string,
        private targetUserId: string,
        private callType: 'voice' | 'video',
        private onSignal: (signal: CallSignal) => void
    ) {}

    async initializeLocalStream(): Promise<MediaStream> {
        try {
            const constraints: MediaStreamConstraints = {
                audio: true,
                video: this.callType === 'video' ? {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } : false
            };

            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            return this.localStream;
        } catch (error) {
            console.error('Error accessing media devices:', error);
            throw error;
        }
    }

    async createPeerConnection(): Promise<void> {
        const configuration: RTCConfiguration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };

        this.peerConnection = new RTCPeerConnection(configuration);

        // Add local tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                if (this.peerConnection) {
                    this.peerConnection.addTrack(track, this.localStream!);
                }
            });
        }

        // Handle remote stream
        this.peerConnection.ontrack = (event) => {
            this.remoteStream = event.streams[0];
            if (this.onRemoteStream) {
                this.onRemoteStream(this.remoteStream);
            }
        };

        // Handle ICE candidates
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate && this.peerConnection) {
                const signal: ICECandidate = {
                    type: 'ice-candidate',
                    candidate: event.candidate.toJSON(),
                    from: this.userId,
                    to: this.targetUserId
                };
                this.onSignal(signal);
            }
        };

        // Process queued ICE candidates
        if (this.remoteDescriptionSet && this.iceCandidateQueue.length > 0) {
            for (const candidate of this.iceCandidateQueue) {
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            }
            this.iceCandidateQueue = [];
        }
    }

    async createOffer(): Promise<void> {
        if (!this.peerConnection) {
            throw new Error('Peer connection not initialized');
        }

        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);

        const signal: CallOffer = {
            type: 'offer',
            offer: offer,
            from: this.userId,
            to: this.targetUserId,
            callType: this.callType
        };

        this.onSignal(signal);
    }

    async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
        if (!this.peerConnection) {
            await this.createPeerConnection();
        }

        await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(offer));
        this.remoteDescriptionSet = true;

        // Process queued ICE candidates
        if (this.iceCandidateQueue.length > 0) {
            for (const candidate of this.iceCandidateQueue) {
                await this.peerConnection!.addIceCandidate(new RTCIceCandidate(candidate));
            }
            this.iceCandidateQueue = [];
        }

        const answer = await this.peerConnection!.createAnswer();
        await this.peerConnection!.setLocalDescription(answer);

        const signal: CallAnswer = {
            type: 'answer',
            answer: answer,
            from: this.userId,
            to: this.targetUserId
        };

        this.onSignal(signal);
    }

    async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
        if (!this.peerConnection) {
            throw new Error('Peer connection not initialized');
        }

        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        this.remoteDescriptionSet = true;

        // Process queued ICE candidates
        if (this.iceCandidateQueue.length > 0) {
            for (const candidate of this.iceCandidateQueue) {
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            }
            this.iceCandidateQueue = [];
        }
    }

    async handleICECandidate(candidate: RTCIceCandidateInit): Promise<void> {
        if (!this.peerConnection) {
            this.iceCandidateQueue.push(candidate);
            return;
        }

        if (!this.remoteDescriptionSet) {
            this.iceCandidateQueue.push(candidate);
            return;
        }

        try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
            console.error('Error adding ICE candidate:', error);
        }
    }

    setOnRemoteStream(callback: (stream: MediaStream) => void): void {
        this.onRemoteStream = callback;
        if (this.remoteStream) {
            callback(this.remoteStream);
        }
    }

    setOnCallEnd(callback: () => void): void {
        this.onCallEnd = callback;
    }

    toggleAudio(): boolean {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                return audioTrack.enabled;
            }
        }
        return false;
    }

    toggleVideo(): boolean {
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                return videoTrack.enabled;
            }
        }
        return false;
    }

    getLocalStream(): MediaStream | null {
        return this.localStream;
    }

    getRemoteStream(): MediaStream | null {
        return this.remoteStream;
    }

    cleanup(): void {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        this.remoteStream = null;
        this.iceCandidateQueue = [];
        this.remoteDescriptionSet = false;
    }
}
