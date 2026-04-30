<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Client billing tax (payroll / driver calculation PDFs)
    |--------------------------------------------------------------------------
    |
    | Tax on agency (client) billing is configured per tenant in the database
    | (tenant_payroll_billing_tax_settings) via the payroll billing tax API.
    |
    */

    /*
    |--------------------------------------------------------------------------
    | Payslip driver invoice PDF
    |--------------------------------------------------------------------------
    |
    | Issuer block (top left): legal name + issuer_address. If issuer_address
    | is empty, remit_address is used so a single PAYSLIP_INVOICE_REMIT_ADDRESS
    | can hold the street address under the company name.
    |
    */
    'payslip_invoice' => [
        'issuer_legal_name' => env('PAYSLIP_INVOICE_ISSUER_LEGAL_NAME'),
        'issuer_address' => env('PAYSLIP_INVOICE_ISSUER_ADDRESS'),
        'remit_address' => env('PAYSLIP_INVOICE_REMIT_ADDRESS'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Pay stub email (driver payroll PDF)
    |--------------------------------------------------------------------------
    |
    | PAY_STUB_EMAIL_CC: comma-separated addresses always CC’d (e.g. finance@).
    | Per-tenant CC: Settings → Company profile → Pay stub CC emails.
    |
    */
    'pay_stub_email' => [
        'cc_addresses' => array_values(array_filter(
            array_map('trim', explode(',', (string) env('PAY_STUB_EMAIL_CC', ''))),
            fn (string $e) => $e !== '' && filter_var($e, FILTER_VALIDATE_EMAIL)
        )),
        'from_name' => env('PAY_STUB_EMAIL_FROM_NAME', 'R&B Finance'),
    ],

];
