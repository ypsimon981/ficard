<?php
declare(strict_types=1);
require __DIR__.'/boot.php';
$action=$_GET['action'] ?? $_POST['action'] ?? '';
try {
 if ($_SERVER['REQUEST_METHOD']==='POST') {
  if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0)>4500000) fail('Il logo è troppo grande.',413);
  $json=str_contains($_SERVER['CONTENT_TYPE'] ?? '', 'application/json');
  $input=$json?json_decode(file_get_contents('php://input'),true,64,JSON_THROW_ON_ERROR):$_POST;
  if(!is_array($input)) fail('Richiesta non valida.');
  if(!hash_equals($_SESSION['csrf'],$input['csrf'] ?? '')) fail('Sessione scaduta. Ricarica la pagina.',403);
  $action=$input['action'] ?? $action;
  if(in_array($action,['setup','login'],true)) {
   $ip=hash('sha256',($_SERVER['REMOTE_ADDR'] ?? '').$config['setupHash']);$attempt=$db['attempts'][$ip] ?? ['at'=>time(),'count'=>0];
   if(time()-$attempt['at']>900) $attempt=['at'=>time(),'count'=>0];
   if($attempt['count']>=8) formError('Troppi tentativi. Riprova tra 15 minuti.');
   $db['attempts'][$ip]=['at'=>$attempt['at'],'count'=>$attempt['count']+1];
   foreach($db['attempts'] as $k=>$v)if(time()-$v['at']>900)unset($db['attempts'][$k]);persist();
   $password=$input['password'] ?? '';
   if($action==='setup') {
    if($db['password']!==null) formError('Configurazione già completata.');
    if(!hash_equals($config['setupHash'],hash('sha256',$input['setupKey'] ?? ''))) formError('Codice di attivazione non valido.');
    if(strlen($password)<12 || strlen($password)>256 || $password!==($input['confirm'] ?? '')) formError('Usa almeno 12 caratteri e ripeti la stessa password.');
    $db['password']=password_hash($password,PASSWORD_DEFAULT);
   } elseif(!$db['password'] || !password_verify($password,$db['password'])) formError('Password non corretta.');
   unset($db['attempts'][$ip]);persist();session_regenerate_id(true);$_SESSION['auth']=true;$_SESSION['last']=time();$_SESSION['csrf']=bin2hex(random_bytes(32));header('Location: ./',true,303);exit;
  }
  auth();
  if($action==='logout'){$_SESSION=[];session_destroy();respond(['ok'=>true]);}
  if($action==='save') {
   $key=$input['key'] ?? '';if(!is_string($key)||!keyValid($key))fail('Identificativo: usa lettere minuscole, numeri o trattini.');
   $name=trim($input['name'] ?? '');if($name===''||strlen($name)>160)fail('Inserisci il nome del marchio (massimo 160 caratteri).');
   $color=$input['color'] ?? '';if(!preg_match('/^#[0-9a-f]{6}$/iD',$color))fail('Colore non valido.');
   $categories=['supermercati','abbigliamento','sport','casa','casalinghi','beauty','petstore','farmacia','elettronica','ristorazione','carburanti','altro'];
   if(!in_array($input['category'] ?? '',$categories,true))fail('Categoria non valida.');
   if(!in_array($input['status'] ?? '',['draft','approved'],true))fail('Stato non valido.');
   $old=$db['brands'][$key] ?? null;$revision=$old['revision'] ?? 0;
   if(($input['revision'] ?? 0)!==$revision)fail('Questa tessera esiste già o è stata modificata. Aprila dall’archivio prima di salvarla.',409);
   $encoded=$input['logo'] ?? '';if(!str_starts_with($encoded,'data:image/png;base64,'))fail('Carica un logo e preparalo nell’editor.');
   $bytes=base64_decode(substr($encoded,22),true);if($bytes===false||strlen($bytes)>3000000)fail('Logo non valido o troppo grande.');
   $size=@getimagesizefromstring($bytes);if(!$size||$size[2]!==IMAGETYPE_PNG||$size[0]>1600||$size[1]>1600)fail('Il logo deve essere PNG, massimo 1600 × 1600.');
   if(!function_exists('imagecreatefromstring'))fail('Attivare l’estensione PHP GD sull’hosting.',503);
   $image=@imagecreatefromstring($bytes);if(!$image)fail('Immagine non leggibile.');imagesavealpha($image,true);
   $revision++;$path=$storage.'/logos/'.$key.'-'.$revision.'.png';if(!imagepng($image,$path))fail('Impossibile salvare il logo.',503);imagedestroy($image);chmod($path,0600);
   $history=$old['history'] ?? [];if($old){$previous=$old;unset($previous['history']);$history[]=$previous;}
   $scale=(int)($input['logoScale'] ?? 80);if($scale<25||$scale>95)fail('Dimensione logo non valida.');
   $record=['key'=>$key,'name'=>$name,'color'=>strtoupper($color),'category'=>$input['category'],'status'=>$input['status'],'logoScale'=>$scale,'revision'=>$revision,'updatedAt'=>gmdate('c'),'history'=>$history];
   $db['brands'][$key]=$record;persist();respond(['brand'=>$record]);
  }
  if($action==='delete') { $key=$input['key'] ?? '';if(!keyValid($key)||!isset($db['brands'][$key]))fail('Tessera non trovata.',404);if(($input['revision'] ?? 0)!==$db['brands'][$key]['revision'])fail('La tessera è cambiata. Ricarica l’archivio.',409);$db['brands'][$key]['deleted']=true;persist();respond(['ok'=>true]); }
  fail('Operazione non disponibile.',404);
 }
 // Public endpoints expose only approved catalog artwork, never the private archive.
 if(in_array($action,['public_catalog','public_logo'],true)){
  header('Access-Control-Allow-Origin: *');
  if($action==='public_catalog'){
   $brands=[];
   foreach($db['brands'] as $b){
    if(($b['deleted'] ?? false)||$b['status']!=='approved')continue;
    $brands[]=['brand_key'=>$b['key'],'name'=>$b['name'],'category'=>$b['category'],'color'=>$b['color'],'mark'=>$b['name'],'logo_url'=>'https://fi-card.app/developer/api.php?action=public_logo&key='.rawurlencode($b['key']).'&revision='.$b['revision'],'logo_scale'=>$b['logoScale'],'revision'=>$b['revision'],'status'=>'published','is_complete'=>true];
   }
   usort($brands,fn($a,$b)=>strcmp($a['brand_key'],$b['brand_key']));
   $version=hash('sha256',json_encode($brands,JSON_UNESCAPED_UNICODE));
   header('Cache-Control: public, max-age=300');
   respond(['version'=>$version,'brands'=>$brands]);
  }
  $key=$_GET['key'] ?? '';$revision=(int)($_GET['revision'] ?? 0);$b=$db['brands'][$key] ?? null;
  if(!is_string($key)||!keyValid($key)||!$b||($b['deleted'] ?? false)||$b['status']!=='approved'||$revision!==$b['revision'])fail('Logo non disponibile.',404);
  $file=$storage.'/logos/'.$key.'-'.$revision.'.png';
  if(!is_file($file))fail('Logo non disponibile.',404);
  header('Content-Type: image/png');header('Cache-Control: public, max-age=86400');readfile($file);exit;
 }
 auth();
 if($action==='list')respond(['brands'=>array_values(array_filter($db['brands'],fn($b)=>!($b['deleted'] ?? false)))]);
 if($action==='logo'){
  $key=$_GET['key'] ?? '';$revision=(int)($_GET['revision'] ?? 0);
  if(!keyValid($key)||$revision<1||!isset($db['brands'][$key])||$revision>$db['brands'][$key]['revision'])fail('Logo non trovato.',404);
  $file=$storage.'/logos/'.$key.'-'.$revision.'.png';if(!is_file($file))fail('Logo non trovato.',404);header('Content-Type: image/png');readfile($file);exit;
 }
 if($action==='export'){
  $brands=[];foreach($db['brands'] as $b){if(($b['deleted'] ?? false)||($b['status']!=='approved'&&($_GET['all'] ?? '')!=='1'))continue;unset($b['history']);$b['logo']='data:image/png;base64,'.base64_encode(file_get_contents($storage.'/logos/'.$b['key'].'-'.$b['revision'].'.png'));$brands[]=$b;}
  header('Content-Disposition: attachment; filename="Fi-Card-marchi-archiviati.json"');respond(['app'=>'Fi-Card-BrandStudio','version'=>1,'exportedAt'=>gmdate('c'),'brands'=>$brands]);
 }
 fail('Operazione non disponibile.',404);
}catch(Throwable $e){error_log('FiCard studio: '.$e->getMessage());fail('Operazione non riuscita. L’archivio precedente resta disponibile.',500);}
