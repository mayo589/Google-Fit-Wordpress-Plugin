<?php
   include './google-fit-api.php';

   date_default_timezone_set('Europe/Prague');
   $dateToday = date("Ymd");   
   $dateHalfYearBefore =  strtotime("-6 months", strtotime($dateToday));
   


    getAggregatedData("com.google.step_count.delta", strtotime($dateToday ) * 1000, $dateHalfYearBefore * 1000,  86400000, $_GET['accessToken']);


?>
