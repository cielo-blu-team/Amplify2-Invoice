export interface AuthContext {
    userId: string;
    email: string;
    role: 'user' | 'accountant' | 'admin';
    token: string;
}
export declare function verifyJwt(token: string): Promise<AuthContext>;
//# sourceMappingURL=auth.d.ts.map