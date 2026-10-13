<?php
// Copiare come catalog-config.php SOLO sull'hosting OVH, non pubblicare nel repository.
return [
  'supabase_url' => 'https://jzmuwixgryvbbqqaudkh.supabase.co',
  'publishable_key' => 'sb_publishable_0_sQOWsPmRR1DWueeOD2gg_6A3IUdjx',
  'admin_token' => 'INSERIRE_TOKEN_CATALOGO_PRIVATO',
  // Mostrare nel pannello solo i mercati realmente implementati.
  'implemented_markets' => [
    'IT' => 'Italia',
  ],
  // Percorso pubblico dove catalog-manager.php salva i nuovi loghi.
  'logo_public_path' => '/assets/catalog-brands',
];
