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

    constructor(
        private userId: string,
        private targetUserId: string,
        private callType: 'voice' | 'video',
        private onSignal: (signal: CallSignal) => void
    ) {}

    async initializeLocalStream(): Promise<MediaStream> {
        try {
            // First try with ideal constraints
            let constraints: MediaStreamConstraints = {
                audio: true,
                video: this.callType === 'video' ? {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } : false
            };

            try {
                this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
                return this.localStream;
            } catch (error: any) {
                // If video device not found, try with more flexible constraints
                if (this.callType === 'video' && error.name === 'NotFoundError') {
                    console.warn('Ideal video device not found, trying with basic constraints');
                    constraints = {
                        audio: true,
                        video: true // Let browser choose any available video device
                    };
                    this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
                    return this.localStream;
                }
                // If still fails, try audio only
                if (this.callType === 'video' && error.name === 'NotFoundError') {
                    console.warn('No video device found, falling back to audio only');
                    constraints = {
                        audio: true,
                        video: false
                    };
                    this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
                    return this.localStream;
                }
                throw error;
            }
        } catch (error) {
            console.error('Error accessing media devices:', error);
            // Provide user-friendly error message
            if (error instanceof Error) {
                if (error.name === 'NotFoundError') {
                    throw new Error('Camera or microphone not found. Please check your device.');
                } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                    throw new Error('Permission denied. Please allow camera/microphone access.');
                } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                    throw new Error('Camera or microphone is already in use by another application.');
                }
            }
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

        // Handle connection state changes
        this.peerConnection.onconnectionstatechange = () => {
            if (this.peerConnection) {
                console.log('Connection state:', this.peerConnection.connectionState);
                if (this.peerConnection.connectionState === 'disconnected' || 
                    this.peerConnection.connectionState === 'failed' ||
                    this.peerConnection.connectionState === 'closed') {
                    this.endCall();
                }
            }
        };
    }

    async createOffer(): Promise<RTCSessionDescriptionInit> {
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

        return offer;
    }

    async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
        if (!this.peerConnection) {
            await this.createPeerConnection();
        }

        await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(offer));
        this.remoteDescriptionSet = true;
        
        // Process any queued ICE candidates
        if (this.iceCandidateQueue.length > 0) {
            console.log('Processing', this.iceCandidateQueue.length, 'queued ICE candidates after setting remote description');
            for (const candidate of this.iceCandidateQueue) {
                try {
                    await this.peerConnection!.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (error) {
                    console.error('Error adding queued ICE candidate:', error);
                }
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
        
        // Process any queued ICE candidates
        if (this.iceCandidateQueue.length > 0) {
            console.log('Processing', this.iceCandidateQueue.length, 'queued ICE candidates after setting remote description');
            for (const candidate of this.iceCandidateQueue) {
                try {
                    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (error) {
                    console.error('Error adding queued ICE candidate:', error);
                }
            }
            this.iceCandidateQueue = [];
        }
    }

    async handleICECandidate(candidate: RTCIceCandidateInit): Promise<void> {
        if (!this.peerConnection) {
            throw new Error('Peer connection not initialized');
        }

        // Queue ICE candidates if remote description is not yet set
        if (!this.remoteDescriptionSet) {
            console.log('Queueing ICE candidate (remote description not set yet)');
            this.iceCandidateQueue.push(candidate);
            return;
        }

        try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
            console.error('Error adding ICE candidate:', error);
            throw error;
        }
    }

    setOnRemoteStream(callback: (stream: MediaStream) => void): void {
        this.onRemoteStream = callback;
    }

    setOnCallEnd(callback: () => void): void {
        this.onCallEnd = callback;
    }

    endCall(): void {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        if (this.onCallEnd) {
            this.onCallEnd();
        }

        const signal: CallEnd = {
            type: 'end',
            from: this.userId,
            to: this.targetUserId
        };
        this.onSignal(signal);
    }

    toggleMute(): boolean {
        if (this.localStream) {
            const audioTracks = this.localStream.getAudioTracks();
            if (audioTracks.length > 0) {
                audioTracks[0].enabled = !audioTracks[0].enabled;
                return audioTracks[0].enabled;
            }
        }
        return false;
    }

    toggleVideo(): boolean {
        if (this.localStream) {
            const videoTracks = this.localStream.getVideoTracks();
            if (videoTracks.length > 0) {
                videoTracks[0].enabled = !videoTracks[0].enabled;
                return videoTracks[0].enabled;
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
}

