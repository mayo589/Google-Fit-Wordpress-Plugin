<?php
    wp_enqueue_script('charts-js', plugin_dir_url(__FILE__) . 'js/chart.js');
    wp_enqueue_script('google-oAuth-Rest-Client', plugin_dir_url(__FILE__) . 'js/gFitRest.js');


    // [google-fit foo="foo-value"]
    function google_fit_shotcode( $atts ) {
        $a = shortcode_atts( array(
            'foo' => 'default foo',
            'test' => 'default test',
        ), $atts );

?>
        <script type="text/javascript">
            test();
        </script>
<?
        return "foo = {$a['foo']}". "test = {$a['test']}" . get_option('google_app_refresh_token', "");
    }

?>
