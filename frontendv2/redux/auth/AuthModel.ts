export interface UserDTO {
    id: string;
    email: string;
    fullName: string;
    profilePicture?: string;
}

export interface SignInRequest {
    email: string;
    password: string;
}

export interface SignUpRequest {
    fullName: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
}

export interface AuthState {
    jwt: string | null;
    reqUser: UserDTO | null;
    searchUser: UserDTO[];
}
