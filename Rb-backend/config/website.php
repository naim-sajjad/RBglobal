<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Public website form notifications
    |--------------------------------------------------------------------------
    |
    | New frontend form entries are stored in the dashboard and also emailed
    | using a dedicated website SMTP transport for contact forms, job
    | applications and subscriptions. Other mail settings stay independent.
    |
    */

    'form_notification_email' => env('WEBSITE_FORM_NOTIFICATION_EMAIL', 'info@gennextglobaltech.ca'),

];
