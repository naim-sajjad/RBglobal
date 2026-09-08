<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Public website form notifications
    |--------------------------------------------------------------------------
    |
    | New frontend form entries are stored in the dashboard and also emailed
    | using the existing Laravel MAIL_* transport. Only the recipient is
    | specific to website forms.
    |
    */

    'form_notification_email' => env('WEBSITE_FORM_NOTIFICATION_EMAIL', 'info@gennextglobaltech.ca'),

];
