<?php
declare(strict_types=1);
ini_set('display_errors','0');
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === 'boot.php') { http_response_code(404); exit; }
$config = require __DIR__.'/config.php';
$local = in_array($_SERVER['SERVER_NAME'] ?? '', ['localhost','127.0.0.1'], true);
$secure = ($_SERVER['HTTPS'] ?? '') === 'on';
if (!$secure && !$local) { header('Location: https://fi-card.app/developer/', true, 308); exit; }
header('Cache-Control: no-store'); header('X-Robots-Tag: noindex, nofollow');
header('X-Content-Type-Options: nosniff'); header('Referrer-Policy: no-referrer');
header("Content-Security-Policy: default-src 'self'; img-src 'self' data: blob:; script-src 'self'; style-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
$storage = $config['storage'];
if (!is_dir($storage) && !@mkdir($storage, 0700, true)) { http_response_code(503); exit('Archivio non disponibile: rendere scrivibile la cartella privata indicata nelle istruzioni.'); }
foreach (['sessions','logos'] as $dir) if (!is_dir($storage.'/'.$dir)) mkdir($storage.'/'.$dir,0700);
ini_set('session.use_strict_mode','1'); session_save_path($storage.'/sessions');
session_name('ficard_studio'); session_set_cookie_params(['lifetime'=>0,'path'=>'/developer/','secure'=>$secure,'httponly'=>true,'samesite'=>'Strict']); session_start();
if (isset($_SESSION['auth']) && time() - ($_SESSION['last'] ?? 0) > 3600) { $_SESSION=[]; session_regenerate_id(true); }
if (isset($_SESSION['auth'])) $_SESSION['last']=time();
$_SESSION['csrf'] ??= bin2hex(random_bytes(32));
$lock=fopen($storage.'/archive.lock','c'); if (!$lock || !flock($lock, LOCK_EX)) { http_response_code(503); exit('Archivio occupato. Riprova.'); }
$dbFile=$storage.'/archive.json';
$db=is_file($dbFile)?json_decode(file_get_contents($dbFile),true,512,JSON_THROW_ON_ERROR):['password'=>null,'brands'=>[],'attempts'=>[]];
function persist(): void { global $db,$dbFile; $tmp=$dbFile.'.tmp'; if(file_put_contents($tmp,json_encode($db,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE),LOCK_EX)===false || !rename($tmp,$dbFile)) throw new RuntimeException('Salvataggio non riuscito'); chmod($dbFile,0600); }
function respond(array $data,int $status=200): never { http_response_code($status);header('Content-Type: application/json; charset=utf-8');echo json_encode($data,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE);exit; }
function fail(string $message,int $status=400): never { respond(['error'=>$message],$status); }
function auth(): void { if(!isset($_SESSION['auth'])) fail('Accedi per continuare.',401); }
function keyValid(string $key): bool { return (bool)preg_match('/^[a-z0-9][a-z0-9_-]{0,63}$/D',$key); }
function formError(string $text): never { $_SESSION['error']=$text;header('Location: ./',true,303);exit; }
