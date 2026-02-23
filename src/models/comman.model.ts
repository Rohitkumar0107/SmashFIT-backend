export interface UserRequest {
    fullName : string,
    email : string,
    password : string,
    avatar_url?: string
}

export interface AccountData {
    user_id: string,
    provider: string,
    provider_account_id: string,
    access_token?: string,
    refresh_token?: string,
    expires_at?: Date
}