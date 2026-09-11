<?php
// Backward-compatible admin API alias. All logic lives in api.php.
$_GET['action'] = $_GET['action'] ?? 'admin_dashboard';
$map=['dashboard'=>'admin_dashboard','merchants'=>'admin_merchants','stores'=>'admin_stores','orders'=>'admin_orders','set_merchant_status'=>'admin_set_merchant_status','set_order_status'=>'admin_set_order_status'];
if(isset($map[$_GET['action']])) $_GET['action']=$map[$_GET['action']];
require __DIR__.'/api.php';
