export interface ClientFormState {
    id: number;
    username: string;
    email: string;
    password_hash: string;
    role: string;
    company_name: string;
    company_address: string;
    contact_person: string;
    phone: string;
    providers: string[];
    is_active: boolean;
}