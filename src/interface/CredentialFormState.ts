export interface CredentialFormState {
  id: number;                // NOT USED FOR NEW ROWS
  client_id: number;
  provider_id: number;

  // Dynamic key-value credential fields
  DTDC_CUSTOMER_CODE?: string;
  api_key?: string;
  api_token?: string;
  password?: string;

  // Raw encrypted form fields
  key?: string;
  env_key?: string;
  encrypted_value?: string;
}
