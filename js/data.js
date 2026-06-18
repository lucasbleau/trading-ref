const VOLUME = [
  {
    id:'vol_base', num:1, title:'Histogramme de Volume', tag:'BASE', kind:'neutral', schema:'vol_base',
    principe:['Barres verticales sous le graphique de prix','Vert = clôture haussière · Rouge = clôture baissière'],
    usage:'Voir où le marché a réellement échangé. Un mouvement sans volume est suspect et peut être inversé facilement.',
    detail:{
      principe:'L\'histogramme de volume est la représentation brute des échanges par bougie. Chaque barre mesure le nombre de contrats échangés pendant la période. Un mouvement avec fort volume a plus de chance de persister. Sans volume, le marché peut facilement revenir en arrière.',
      signaux:['Volume fort + hausse des prix → tendance saine, continuation probable','Volume fort + baisse des prix → distribution ou panique, continuation probable','Volume faible + hausse → manque de conviction haussière, risque de retournement','Volume faible + baisse → manque de conviction baissière, possible rebond','Pic de volume isolé → événement significatif (news, liquidation), zone à surveiller'],
      parametres:[{p:'Bougie standard',d:'1 barre = 1 période de temps'},{p:'Colorisation',d:'Vert/Rouge selon la direction de la bougie'},{p:'Cumulatif (VP)',d:'Volume par niveau de prix — plus d\'informations'}],
      erreurs:['Ignorer le volume complètement — il confirme ou invalide chaque signal','Comparer le volume absolu entre marchés différents — utiliser le RVOL','Oublier les effets de fin de séance ou de week-end qui biaisent le volume'],
      pine:`//@version=5
indicator("Volume", overlay=false)
col = close >= open ? color.green : color.red
plot(volume, "Volume", col, style=plot.style_histogram)
plot(ta.sma(volume, 20), "Vol Moy 20", color.orange, 1)`
    }
  },
  {
    id:'rvol', num:2, title:'Volume Relatif (RVOL)', tag:'FORCE', kind:'bull', schema:'rvol',
    principe:['RVOL = Volume actuel / Volume moyen (20 périodes)','RVOL > 1,5 = volume inhabituellement fort · RVOL < 0,5 = anémique'],
    usage:'Mesure si le volume est anormalement élevé. RVOL > 1,5 au déclenchement d\'un signal renforce sa fiabilité.',
    detail:{
      principe:'Le RVOL (Relative Volume) compare le volume actuel au volume moyen historique. Un RVOL de 2,0 signifie que le marché échange deux fois plus que d\'habitude. C\'est cette anomalie qui est significative. Le RVOL permet de comparer différents actifs et différentes heures de la journée.',
      signaux:['RVOL > 1,5 à la cassure d\'un niveau → signal fiable','RVOL < 0,8 à la cassure → méfiance, possible fausse cassure','Spike RVOL isolé sans cassure → possible manipulation ou news','RVOL fort sur bougie de rejet (mèche longue) → signal de retournement puissant'],
      parametres:[{p:'Période 20',d:'Standard — s\'adapte aux 20 dernières périodes'},{p:'Seuils',d:'1.5 = notable · 2.0 = fort · 3.0+ = exceptionnel'},{p:'Intraday',d:'Normaliser par l\'heure de la journée pour plus de précision'}],
      erreurs:['Utiliser le RVOL seul sans signal de prix — le volume fort peut aller dans les deux sens','Comparer le RVOL pré-market avec le RVOL intrasession — les horaires biaisent la moyenne'],
      pine:`//@version=5
indicator("RVOL", overlay=false)
vol_avg = ta.sma(volume, 20)
rvol    = volume / vol_avg
col = rvol > 1.5 ? color.orange : close >= open ? color.green : color.red
plot(rvol, "RVOL", col, style=plot.style_histogram)
hline(1.5, "Seuil fort", color.orange, linestyle=hline.style_dashed)
hline(1.0, "Neutre",     color.gray,   linestyle=hline.style_dotted)`
    }
  },
  {
    id:'vol_tend', num:3, title:'Volume + Tendance (4 Cas)', tag:'CONFIRMATION', kind:'neutral', schema:'vol_tend',
    principe:['Hausse + vol fort = tendance saine · Hausse + vol faible = rebond fragile','Baisse + vol fort = downtrend solide · Baisse + vol faible = repli dans un uptrend'],
    usage:'La combinaison prix + volume donne la conviction. Volume croissant dans le sens de la tendance = continuation.',
    detail:{
      principe:'Il existe quatre combinaisons prix/volume à mémoriser. Elles donnent la conviction derrière chaque mouvement et aident à anticiper les retournements par perte de volume dans le sens de la tendance.',
      signaux:['Hausse + volume fort → uptrend sain, acheteurs convaincus → rester long','Hausse + volume faible → rebond technique sans conviction → stop rapproché','Baisse + volume fort → downtrend sain ou capitulation → rester short','Baisse + volume faible → repli sain dans un uptrend → zone d\'achat possible'],
      parametres:[{p:'Volume fort',d:'RVOL > 1,3 par rapport à la moyenne'},{p:'Volume faible',d:'RVOL < 0,7 — peu d\'intérêt du marché'},{p:'Confirmation',d:'Observer la tendance du volume sur 3-5 bougies, pas une seule'}],
      erreurs:['Réagir sur une seule bougie — observer la tendance du volume sur 3-5 bougies','Ignorer le contexte macro : volume faible un jour férié ne signifie rien'],
      pine:`//@version=5
indicator("Volume Tendance", overlay=false)
avg  = ta.sma(volume, 20)
up_s = close > close[1] and volume > avg * 1.3
up_w = close > close[1] and volume < avg * 0.7
dn_s = close < close[1] and volume > avg * 1.3
dn_w = close < close[1] and volume < avg * 0.7
col  = up_s ? color.green : up_w ? color.new(color.green,60) : dn_s ? color.red : dn_w ? color.new(color.red,60) : color.gray
plot(volume, "Vol", col, style=plot.style_histogram)`
    }
  },
  {
    id:'vpvr', num:4, title:'Volume Profile (VPVR)', tag:'STRUCTURE', kind:'neutral', schema:'vpvr',
    principe:['Distribution du volume par niveau de prix (et non par temps)','Barres horizontales : courtes = peu échangé · longues = très échangé'],
    usage:'Révèle les zones d\'intérêt institutionnel. POC = aimant principal. VAH/VAL = bornes de la Value Area (70% des échanges).',
    detail:{
      principe:'Le Volume Profile (VPVR = Volume Profile Visible Range) représente la distribution du volume non plus dans le temps, mais par niveau de prix. Chaque barre horizontale montre combien de volume a été échangé à ce niveau. Il révèle où les institutions ont réellement acheté et vendu.',
      signaux:['POC → niveau le plus échangé, aimant et support/résistance fort','Value Area (70% du volume) → zone de consensus ; retour dans la VA = probable','Prix hors de la VA → excès qui tend à revenir dans la VA','Profil en D (cloche) → équilibre · Profil P → distribution · Profil b → accumulation'],
      parametres:[{p:'Visible Range',d:'Calcul sur toute la plage visible — s\'adapte au zoom'},{p:'Session Range',d:'Une session = une distribution'},{p:'N buckets',d:'18-24 tranches pour un profil lisible'}],
      erreurs:['Utiliser avec peu de données → profil non représentatif (minimum 20-30 bougies)','Confondre VPVR (range entier automatique) et FRVP (plage fixe manuelle)'],
      pine:`// Volume Profile disponible nativement dans TradingView
// Indicateurs → Volume Profile → Visible Range
// Ou : Indicateurs → Volume Profile → Session`
    }
  },
  {
    id:'poc', num:5, title:'Point of Control (POC)', tag:'RÉFÉRENCE', kind:'neutral', schema:'poc',
    principe:['Niveau de prix ayant concentré le plus grand volume','Fort aimant pour le prix — tendance naturelle à y revenir'],
    usage:'Cible prioritaire lors d\'un retour. Support si le prix est au-dessus, résistance si en dessous.',
    detail:{
      principe:'Le POC (Point of Control) est le niveau de prix où le plus grand volume a été échangé. C\'est le centre de gravité du marché — le prix tend naturellement à y revenir, car c\'est là que les deux parties se sont accordés sur la valeur.',
      signaux:['Prix au-dessus du POC → le POC est un support potentiel','Prix en dessous du POC → le POC est une résistance potentielle','Retour sur le POC + rejet → point d\'entrée dans la direction du biais','POC aligné avec un OB ou FVG → confluence forte'],
      parametres:[{p:'POC journalier',d:'Référence intraday majeure'},{p:'POC hebdomadaire',d:'Référence swing trading'},{p:'POC de range',d:'FRVP posé sur une zone d\'intérêt spécifique'}],
      erreurs:['Trader le POC isolément sans biais directionnel','Ignorer que le POC peut migrer avec de nouveaux échanges'],
      pine:`// POC = ligne rouge horizontale sur le Volume Profile TradingView
// Créer une alerte sur le niveau du POC du jour précédent`
    }
  },
  {
    id:'va', num:6, title:'Value Area (VAH / VAL)', tag:'ZONE', kind:'blue', schema:'va',
    principe:['Zone concentrant 70% du volume total (convention standard ICT/Market Profile)','VAH = borne haute · VAL = borne basse'],
    usage:'Le prix revient souvent dans la VA après s\'en être écarté. VAH et VAL = zones de retournement fréquentes.',
    detail:{
      principe:'La Value Area est la zone de prix contenant 70% du volume total échangé. C\'est la "juste valeur" perçue par le marché. Au-dessus du VAH ou en dessous du VAL, le prix est en excès et tend à revenir dans la VA. Convention issue du Market Profile (Peter Steidlmayer).',
      signaux:['Prix retourne dans la VA depuis au-dessus → tendance à continuer vers le POC puis VAL','Prix retourne dans la VA depuis en dessous → tendance vers POC puis VAH','Prix reste hors de la VA toute la session → fort momentum dans cette direction','VAH/VAL = S/R dynamiques intraday pour les retournements'],
      parametres:[{p:'70% standard',d:'Convention Market Profile / ICT'},{p:'Session Daily',d:'VP journalier — se remet à zéro chaque jour'},{p:'VWAP ± σ',d:'Alternative approximative à la Value Area'}],
      erreurs:['Attendre systématiquement un retour dans la VA — en trend fort, le prix ne revient pas','Confondre VAH/VAL avec les Bandes de Bollinger — calcul totalement différent'],
      pine:`// VAH et VAL : lignes bleues pointillées du Volume Profile TradingView
// Configurer l'affichage dans les paramètres du Volume Profile`
    }
  },
  {
    id:'hvn', num:7, title:'High Volume Node (HVN)', tag:'SUPPORT/RÉSISTANCE', kind:'bull', schema:'hvn',
    principe:['Niveau de prix avec un volume concentré exceptionnellement élevé','Le prix y ralentit ou s\'arrête — forte zone institutionnelle'],
    usage:'Le HVN attire le prix et le ralentit. Excellent niveau pour un objectif partiel ou pour attendre une réaction.',
    detail:{
      principe:'Un HVN est un pic de volume dans le profil — un niveau de prix où beaucoup d\'échanges ont eu lieu. Le HVN crée une forte zone d\'intérêt : le prix a du mal à le traverser sans consolider. C\'est un niveau de support ou résistance chargé de volume institutionnel.',
      signaux:['Prix approche un HVN depuis le bas → résistance probable','Prix approche un HVN depuis le haut → support probable','Retour sur HVN après cassure → zone de pull-back idéale','HVN coïncidant avec un OB → confluence forte, zone très solide'],
      parametres:[{p:'Définition visuelle',d:'Barre significativement plus longue que ses voisines'},{p:'Relativité',d:'Comparer les barres entre elles — pas de seuil absolu'},{p:'Importance',d:'HVN journalier > HVN horaire'}],
      erreurs:['Confondre HVN et POC — le POC est le HVN absolu, mais il peut y en avoir plusieurs','Penser que le HVN bloque toujours — un déplacement fort peut le traverser'],
      pine:`// HVN : barre longue dans le Volume Profile
// Placer un niveau horizontal sur le HVN pour les alertes`
    }
  },
  {
    id:'lvn', num:8, title:'Low Volume Node (LVN)', tag:'PASSAGE RAPIDE', kind:'amber', schema:'lvn',
    principe:['Niveau de prix avec très peu de volume échangé','Le prix traverse ces zones rapidement — peu de résistance des deux côtés'],
    usage:'Le LVN est un couloir vide : le prix accélère en le traversant. Anticiper la vitesse du mouvement.',
    detail:{
      principe:'Un LVN est une zone du profil avec très peu de barres horizontales. Le marché y a passé peu de temps, donc il y a peu d\'intérêt des deux côtés. Le prix traverse généralement ces zones rapidement, sans consolider — idéal pour anticiper des mouvements rapides.',
      signaux:['Prix entre dans un LVN → accélération probable, peu de résistance','LVN entre POC et prix → le prix peut rapidement atteindre le POC','LVN au-dessus d\'un HVN cassé → route libre vers le prochain HVN','LVN dans un OB → l\'OB est plus fragile qu\'il n\'y paraît'],
      parametres:[{p:'Définition visuelle',d:'Barre courte entourée de barres plus longues'},{p:'Gap de profil',d:'Cas extrême : aucun échange → passage quasi instantané'},{p:'Contexte',d:'LVN entre deux HVN = couloir → objectif clair'}],
      erreurs:['Placer des stops dans un LVN — le prix peut sauter plusieurs pips d\'un coup','Oublier que la vitesse de traversée dépend du momentum global'],
      pine:`// LVN : barre courte dans le Volume Profile
// Identifier les gaps entre HVN pour anticiper les couloirs`
    }
  },
  {
    id:'frvp_base', num:9, title:'Principe du FRVP', tag:'STRUCTURE', kind:'neutral', schema:'frvp_base',
    principe:['Fixed Range VP : calculé sur une plage de bougies sélectionnée manuellement','Contrairement au VPVR, il ne change pas avec le zoom'],
    usage:'Analyser la distribution du volume sur une zone précise : un swing, une consolidation, un range.',
    detail:{
      principe:'Le FRVP (Fixed Range Volume Profile) est un Volume Profile calculé sur une plage de bougies que l\'analyste sélectionne manuellement. Il reste figé même quand le prix avance. Idéal pour analyser une structure spécifique (swing, accumulation, range).',
      signaux:['Sélectionner la plage → voir le POC et la Value Area de cette structure précise','POC du FRVP = niveau de consensus sur cette phase','VA du FRVP = zone de retour probable si le prix en sort','FRVP sur l\'historique récent → identifier les niveaux de référence institutionnels'],
      parametres:[{p:'Plage manuelle',d:'Sélectionner le début et la fin de la zone à analyser'},{p:'Disponibilité',d:'Disponible dans TradingView (version payante)'},{p:'Overlapping',d:'Plusieurs FRVP peuvent se superposer sur le même graphique'}],
      erreurs:['Sélectionner une plage trop large → profil peu précis, dilué','Sélectionner trop peu de bougies → non représentatif'],
      pine:`// FRVP disponible dans TradingView (version payante)
// Dessin → Volume Profile → Fixed Range
// Tracer la sélection sur la zone à analyser`
    }
  },
  {
    id:'frvp_swing', num:10, title:'FRVP sur un Swing', tag:'ANALYSE', kind:'bull', schema:'frvp_swing',
    principe:['Poser le FRVP sur un swing haussier ou baissier complet','Le POC du swing = niveau de retrace prioritaire'],
    usage:'Si le prix revient sur ce swing, le POC agit comme aimant. Confluence Fibonacci + POC = zone d\'entrée premium.',
    detail:{
      principe:'En posant un FRVP sur un swing entier (du creux au sommet ou inversement), on identifie les niveaux clés de cette impulsion. Le POC du swing est le niveau où le marché a le plus échangé pendant ce mouvement — souvent là que le prix revient lors d\'un retrace.',
      signaux:['POC du swing = 1er niveau de retrace après le mouvement','Si retrace jusqu\'au POC → zone d\'entrée dans le sens du swing','Si retrace au-delà du POC → signe de faiblesse du swing','VAL (en upswing) → niveau de retrace maximal avant invalidation'],
      parametres:[{p:'Swing complet',d:'Du point de départ au sommet/creux de l\'impulsion'},{p:'Confluence',d:'POC du swing + Fibonacci 50-61.8% = zone premium'},{p:'FRVP + OB',d:'POC coïncidant avec l\'OB = zone d\'entrée idéale'}],
      erreurs:['Sélectionner un swing trop petit — pas assez de données pour un profil fiable','Ignorer le contexte HTF — le FRVP swing doit être dans le sens du biais'],
      pine:`// FRVP sur swing :
// 1. Identifier le swing (du creux au sommet)
// 2. Appliquer le FRVP sur cette plage exacte
// 3. Annoter le POC et la Value Area`
    }
  },
  {
    id:'frvp_smc', num:11, title:'FRVP sur OB / FVG', tag:'SMC + VOLUME', kind:'vio', schema:'frvp_smc',
    principe:['Poser un FRVP précisément sur un Order Block ou FVG','Vérifier si la zone est un HVN (solide) ou LVN (fragile)'],
    usage:'Un OB avec HVN = zone institutionnelle très solide. Un OB avec LVN = risque de traversée rapide sans réaction.',
    detail:{
      principe:'En combinant SMC et Volume Profile, on ajoute une dimension supplémentaire. Un OB ou FVG n\'a pas la même valeur selon que beaucoup ou peu de volume a été échangé à ce niveau. Un HVN dans l\'OB = zone très défendue. Un LVN = possible fausse zone.',
      signaux:['OB + HVN → zone d\'entrée haute probabilité, les institutions défendront ce niveau','OB + LVN → zone fragile, risque de traversée sans réaction','FVG dans un LVN → comblement rapide probable','FVG dans un HVN → résistance au comblement, zone plus durable'],
      parametres:[{p:'FRVP sur l\'OB',d:'Sélectionner précisément les bougies de l\'Order Block'},{p:'Résolution',d:'Minimum 5-10 bougies dans l\'OB pour un profil valide'},{p:'Confluence',d:'OB + HVN + Fibonacci = setup très haute probabilité'}],
      erreurs:['Poser le FRVP sur trop peu de bougies — profil non représentatif','Ignorer un LVN dans l\'OB — signal d\'alerte souvent négligé'],
      pine:`// Workflow SMC + FRVP :
// 1. Identifier l'OB ou FVG
// 2. Poser le FRVP sur la zone
// 3. HVN → OB solide (entrée prioritaire)
// 4. LVN → OB fragile (prudence accrue)`
    }
  },
  {
    id:'delta', num:12, title:'Delta de Volume', tag:'DÉSÉQUILIBRE', kind:'neutral', schema:'delta',
    principe:['Delta = Volume acheteur − Volume vendeur par bougie','Delta cumulé = tendance de la pression acheteur/vendeur'],
    usage:'Delta positif cumulé en uptrend = hausse saine. Divergence delta/prix = avertissement de retournement.',
    detail:{
      principe:'Le Delta de volume mesure la différence entre le volume exécuté à l\'ask (acheteurs agressifs) et à la bid (vendeurs agressifs). Un delta positif indique que les acheteurs ont été plus agressifs. Le delta cumulé révèle la tendance de cette pression sur la session.',
      signaux:['Delta cumulé monte avec le prix → uptrend sain','Delta cumulé diverge du prix (baisse alors que prix monte) → signe de distribution','Delta cumulé monte alors que prix baisse → absorption/accumulation','Spike de delta négatif sur bougie haussière → manipulation'],
      parametres:[{p:'Delta brut',d:'Par bougie — volatile, utile pour les entrées précises'},{p:'CVD',d:'Cumulative Volume Delta — tendance sur la session'},{p:'Données',d:'Nécessite des données tick (flux L2) pour être précis'}],
      erreurs:['Disponible uniquement avec données tick — approximation seulement avec OHLCV','Approximation : si clôture > ouverture → volume haussier (très grossier)'],
      pine:`//@version=5
indicator("Delta approx.", overlay=false)
bull_vol = close >= open ? volume : 0.0
bear_vol = close <  open ? volume : 0.0
delta    = bull_vol - bear_vol
cum_d    = ta.cum(delta)
plot(cum_d, "Δ Cumulé", color.teal, 2)
hline(0, "Zéro", color.gray, linestyle=hline.style_dotted)`
    }
  },
  {
    id:'absorption', num:13, title:'Absorption / Volume Imbalance', tag:'PIÈGE', kind:'vio', schema:'absorption',
    principe:['Bougie avec très fort volume mais mouvement de prix minimal (doji, pinbar)','Un gros acteur absorbe tous les ordres opposés — le prix ne peut pas avancer'],
    usage:'L\'absorption stoppe le mouvement en cours. Signe d\'un retournement ou d\'un support/résistance institutionnel majeur.',
    detail:{
      principe:'L\'absorption se produit quand un acteur institutionnel achète/vend massivement contre le mouvement en cours, absorbant tous les ordres opposés. Résultat : fort volume mais prix qui ne bouge presque pas. C\'est une empreinte institutionnelle puissante à ne pas manquer.',
      signaux:['Bougie doji ou pinbar + RVOL > 2 → absorption probable','Volume fort + clôture au milieu du range → équilibre forcé','Volume fort sur un niveau clé (support, OB, POC) + rejet → zone institutionnelle confirmée','Plusieurs bougies à fort volume au même niveau → zone très défendue'],
      parametres:[{p:'Critères',d:'RVOL > 2 + amplitude bougie < 25% du range moyen récent'},{p:'Localisation',d:'Doit se produire sur un niveau clé (POC, HVN, OB, S/R)'},{p:'Confirmation',d:'Bougie suivante qui confirme le sens de l\'absorption'}],
      erreurs:['Confondre avec une bougie d\'indécision normale (volume faible)','Ignorer la localisation — une absorption loin de tout niveau clé est moins significative','Entrer immédiatement sans attendre confirmation'],
      pine:`//@version=5
indicator("Absorption", overlay=true)
avg_vol   = ta.sma(volume, 20)
avg_rng   = ta.sma(high - low, 20)
hi_vol    = volume > avg_vol * 2
small_rng = (high - low) < avg_rng * 0.35
absorb    = hi_vol and small_rng
bgcolor(absorb ? color.new(color.purple, 88) : na)`
    }
  },
  {
    id:'div_vol', num:14, title:'Divergence Volume / Prix', tag:'SIGNAL', kind:'bear', schema:'div_vol',
    principe:['Prix fait de nouveaux plus-hauts mais le volume diminue','Signe que les acheteurs s\'épuisent — le momentum baisse'],
    usage:'Divergence baissière : nouveaux highs sans volume = retournement possible. À confirmer avec RSI ou structure.',
    detail:{
      principe:'Une divergence volume/prix se produit quand la direction du prix ne correspond plus à l\'énergie qui la soutient. La plus commune : le prix monte mais le volume sur chaque vague est plus faible. Les acheteurs sont de moins en moins nombreux — le mouvement est fragile.',
      signaux:['Prix HH + Volume décroissant sur chaque vague → divergence baissière','Prix LL + Volume décroissant → divergence haussière (vendeurs épuisés)','Confirmer avec RSI (divergence RSI simultanée) → signal très fort','Divergence sur un niveau clé (résistance, POC, OB) → probabilité accrue'],
      parametres:[{p:'Durée',d:'Minimum 2-3 swings pour valider la divergence'},{p:'Type',d:'Baissière (prix ↑, vol ↓) · Haussière (prix ↓, vol ↓)'},{p:'Confirmation',d:'Toujours confirmer avec un CHoCH de structure'}],
      erreurs:['Trader la divergence sans CHoCH — le prix peut continuer longtemps','Identifier une divergence sur une seule bougie — il faut au moins 2 swings'],
      pine:`//@version=5
indicator("Div Vol/Prix", overlay=false)
vol_avg = ta.sma(volume, 10)
plot(volume,  "Volume",  close >= open ? color.green : color.red, style=plot.style_histogram)
plot(vol_avg, "Moy Vol", color.orange, 1)`
    }
  },
  {
    id:'vol_smc', num:15, title:'Volume Profile + SMC', tag:'MÉTHODE', kind:'bull', schema:'vol_smc',
    principe:['Superposer le Volume Profile aux zones SMC (OB, FVG, liquidité)','HVN dans un OB = zone institutionnelle très haute probabilité'],
    usage:'SMC donne la ZONE, Volume Profile donne la CONVICTION. Ensemble = confluence maximale et entrées de haute probabilité.',
    detail:{
      principe:'La combinaison VP + SMC est l\'une des approches les plus robustes en analyse institutionnelle. Le SMC identifie les zones et la structure. Le Volume Profile valide ces zones en montrant si elles sont réellement chargées de volume institutionnel. Un OB sans HVN est plus faible qu\'un OB avec HVN.',
      signaux:['Séquence optimale : HTF tendance → POC/VAL retour → OB en discount → HVN → entrée','OB + HVN + 61.8% Fibonacci → triple confluence → setup très haute probabilité','Sweep de liquidité + retour sur POC → entrée avec volume confirmé','Displacement avec RVOL > 2 + FVG créé → FVG de haute qualité'],
      parametres:[{p:'Volume Profile',d:'VPVR journalier ou FRVP sur le swing analysé'},{p:'SMC',d:'Structure (HTF) + OB/FVG (MTF) + confirmation (LTF)'},{p:'Confluence',d:'Minimum 3 éléments alignés avant d\'entrer'}],
      erreurs:['Négliger la tendance HTF — tous les éléments doivent être dans son sens','Entrer sur une confluence sans stop défini (sous le sweep ou sous l\'OB)'],
      pine:`// Workflow Volume Profile + SMC :
// ✓ HTF : tendance + pools de liquidité
// ✓ MTF : Volume Profile → POC / VAH / VAL
// ✓ FRVP sur OB → HVN ou LVN ?
// ✓ Sweep + CHoCH → biais confirmé
// ✓ Retour sur OB + HVN + Fib 61.8%
// ✓ LTF : CHoCH + entrée
// ✓ Stop sous le sweep · Target = pool opposé`
    }
  }
];

const INDICATEURS = [
  {
    id:'sma', num:1, title:'SMA — Moyenne Mobile Simple', tag:'TENDANCE', kind:'neutral', schema:'sma',
    principe:['Moyenne arithmétique des N dernières clôtures','Réglages courants : 20, 50, 200 périodes'],
    usage:'Filtre de tendance : prix au-dessus = biais haussier. Lente à réagir mais robuste comme support/résistance dynamique.',
    detail:{
      principe:'La SMA (Simple Moving Average) est la moyenne des N derniers prix de clôture. Chaque valeur a le même poids. Elle lisse le bruit du marché et révèle la direction de fond. Plus N est grand, plus la courbe est lisse mais tardive.',
      formule:'SMA(n) = (C₁ + C₂ + … + Cₙ) / n\n\nC = prix de clôture, n = période',
      calcul:['Choisir la période n (ex : 20)','Additionner les 20 derniers prix de clôture','Diviser la somme par 20','À chaque nouvelle bougie : retirer la plus ancienne, ajouter la nouvelle, recalculer'],
      signaux:['Prix > SMA → biais haussier, garder les longs','Prix < SMA → biais baissier, garder les shorts','Croisement prix/SMA → possible changement de tendance','SMA 200 : niveau institutionnel de référence pour le long terme'],
      parametres:[{p:'n = 20',d:'Court terme — structure de swing, day trading'},{p:'n = 50',d:'Moyen terme — tendance de fond sur quelques semaines'},{p:'n = 200',d:'Long terme — tendance majeure, niveau suivi par les institutions'}],
      erreurs:["Ne jamais l'utiliser comme signal isolé — elle confirme, ne prédit pas","Le lag augmente avec n : une SMA 200 réagit très lentement aux retournements","En range, le prix coupe la SMA constamment → faux signaux",'Différencier SMA et EMA : la SMA pondère également tous les points'],
      pine:`//@version=5
indicator("SMA", overlay=true)
n   = input.int(20, "Période", minval=1)
s   = ta.sma(close, n)
plot(s, "SMA", color.new(color.orange, 0), 2)
bgcolor(close > s ? color.new(color.green,92) : color.new(color.red,92))`
    }
  },
  {
    id:'ema', num:2, title:'EMA — Moyenne Mobile Exponentielle', tag:'TENDANCE', kind:'bull', schema:'ema',
    principe:['Pondère davantage les prix récents grâce à un facteur exponentiel','Réagit plus vite que la SMA (moins de lag)'],
    usage:"Même usage que la SMA, mais plus réactive — idéale en day-trading. Les EMA 9 / 21 / 50 sont les plus suivies.",
    detail:{
      principe:"L'EMA (Exponential Moving Average) donne plus de poids aux prix récents via un facteur de lissage k = 2/(n+1). Elle suit le prix plus fidèlement que la SMA, ce qui la rend plus adaptée aux marchés rapides.",
      formule:'k = 2 / (n + 1)\nEMA(aujourd\'hui) = Prix × k + EMA(hier) × (1 − k)\n\nInitialisation : EMA(n) = SMA(n) pour la première valeur',
      calcul:["Calculer k = 2 / (n + 1) — ex. pour n=9 : k = 0,20",'Initialiser : calculer la SMA des n premières clôtures','Appliquer la formule récursive à chaque nouvelle bougie','Plus k est grand (n petit), plus la réponse aux prix récents est forte'],
      signaux:['Prix > EMA → tendance haussière à court terme','EMA rapide > EMA lente → momentum haussier','Rebond sur EMA en tendance → point d\'entrée classique','Cassure franche de l\'EMA avec clôture → signal de retournement'],
      parametres:[{p:'n = 9',d:'Très réactif — scalping, lecture du momentum immédiat'},{p:'n = 21',d:'Court terme — swing trading intraday'},{p:'n = 50',d:'Moyen terme — comparable à la SMA 50'},{p:'n = 200',d:'Long terme — référence institutionnelle'}],
      erreurs:['Surpondérer les mouvements brusques (spike) qui biaisent temporairement l\'EMA','Choisir n trop petit → courbe trop bruitée, trop de faux croisements','Ignorer que l\'EMA diverge de la SMA en tendance forte — les deux ont leur utilité'],
      pine:`//@version=5
indicator("EMA", overlay=true)
n    = input.int(20, "Période", minval=1)
e    = ta.ema(close, n)
plot(e, "EMA", color.new(color.orange, 0), 2)
// Ruban EMA rapide / lente
e9   = ta.ema(close, 9)
e21  = ta.ema(close, 21)
plot(e9,  "EMA 9",  color.aqua,   1)
plot(e21, "EMA 21", color.purple, 1)`
    }
  },
  {
    id:'cross', num:3, title:'Croisement de Moyennes', tag:'SIGNAL', kind:'neutral', schema:'cross',
    principe:['Une moyenne rapide croise une moyenne lente pour générer un signal','Golden cross (rapide > lente) / Death cross (rapide < lente)'],
    usage:'Golden cross = signal haussier, death cross = signal baissier. Fiable en tendance, génère des faux signaux en range.',
    detail:{
      principe:'Le croisement de deux moyennes mobiles (une rapide et une lente) génère des signaux directionnels. Le Golden Cross (MA rapide passe au-dessus) signale une dynamique haussière ; le Death Cross (rapide passe en dessous) signale une dynamique baissière.',
      formule:'Signal ACHAT  : EMA(rapide) croise au-dessus EMA(lente)\nSignal VENTE  : EMA(rapide) croise en dessous EMA(lente)\n\nCombos classiques : 9/21 · 20/50 · 50/200',
      calcul:['Tracer deux EMA ou SMA de périodes différentes','Observer quand la rapide croise la lente','Signal haussier : rapide passe AU-DESSUS de la lente','Signal baissier : rapide passe EN-DESSOUS de la lente','Confirmer avec le volume ou la structure du marché'],
      signaux:['Golden cross 50/200 : signal haussier long terme très suivi','Death cross 50/200 : signal baissier long terme','Croisement EMA 9/21 : scalping et day trading','Attendre la clôture de la bougie pour confirmer le croisement'],
      parametres:[{p:'9 / 21',d:'Court terme — day trading, signaux fréquents'},{p:'20 / 50',d:'Moyen terme — swing trading'},{p:'50 / 200',d:'Long terme — Golden/Death Cross institutionnel'}],
      erreurs:['En range, les croisements se multiplient → whipsaw (faux signaux dans les deux sens)','Le signal arrive avec retard — le mouvement est souvent déjà bien entamé','Ne pas utiliser deux MA de même type — préférer EMA rapide + SMA lente pour plus de réactivité'],
      pine:`//@version=5
indicator("MA Cross", overlay=true)
fast = ta.ema(close, 9)
slow = ta.ema(close, 21)
plot(fast, "Rapide", color.orange, 2)
plot(slow, "Lente",  color.purple, 2)
cross_up   = ta.crossover(fast,  slow)
cross_down = ta.crossunder(fast, slow)
plotshape(cross_up,   "Golden", shape.labelup,   location.belowbar, color.green, text="G")
plotshape(cross_down, "Death",  shape.labeldown, location.abovebar, color.red,   text="D")`
    }
  },
  {
    id:'boll', num:4, title:'Bandes de Bollinger', tag:'VOLATILITÉ', kind:'neutral', schema:'boll',
    principe:['SMA 20 entourée de bandes à ±2 écarts-types','Les bandes s\'écartent quand la volatilité monte (expansion)'],
    usage:'Squeeze = calme avant explosion. Toucher une bande = excès possible. Ne pas utiliser comme signal isolé.',
    detail:{
      principe:'Les Bandes de Bollinger encadrent le prix avec des limites statistiques. Les bandes représentent ±2 écarts-types autour d\'une SMA 20, contenant théoriquement ~95 % des clôtures. Elles mesurent la volatilité relative et repèrent les extrêmes.',
      formule:'Bande médiane  = SMA(close, 20)\nÉcart-type (σ) = √[ Σ(Cᵢ − SMA)² / n ]\nBande haute    = SMA + 2σ\nBande basse    = SMA − 2σ',
      calcul:['Calculer la SMA 20','Calculer l\'écart-type glissant sur 20 périodes','Multiplier σ par 2','Ajouter/soustraire ce résultat à la SMA','Observer la largeur des bandes (volatilité) et la position du prix'],
      signaux:['Squeeze (bandes serrées) → faible volatilité, explosion imminente','Prix touche la bande haute → zone de résistance dynamique, possible retour','Prix touche la bande basse → zone de support dynamique','Marche le long de la bande haute en tendance forte → continuation, pas de short','%B = (Prix − BB_basse) / (BB_haute − BB_basse) : mesure la position dans la bande'],
      parametres:[{p:'n = 20, k = 2',d:'Standard — convient à la majorité des marchés'},{p:'n = 10, k = 1.5',d:'Intraday, plus réactif'},{p:'n = 50, k = 2.5',d:'Long terme, moins de faux signaux'}],
      erreurs:['Vendre automatiquement à la bande haute en tendance forte — le prix peut y "marcher" longtemps','Oublier que les bandes ne donnent pas de direction, seulement la volatilité relative','Confondre squeeze et signal directionnel — la direction s\'obtient par la cassure'],
      pine:`//@version=5
indicator("Bollinger Bands", overlay=true)
n  = input.int(20, "Période")
k  = input.float(2.0, "Multiplicateur")
[mid, hi, lo] = ta.bb(close, n, k)
plot(mid, "Médiane", color.orange, 1, plot.style_line)
ph = plot(hi, "Haute",   color.teal, 1)
pl = plot(lo, "Basse",   color.teal, 1)
fill(ph, pl, color.new(color.teal, 88))`
    }
  },
  {
    id:'keltner', num:5, title:'Canaux de Keltner', tag:'VOLATILITÉ', kind:'neutral', schema:'keltner',
    principe:['EMA entourée de bandes basées sur l\'ATR (pas l\'écart-type)','Plus lisses que Bollinger — moins sensibles aux spikes'],
    usage:'Lecture proche de Bollinger. Le squeeze BB à l\'intérieur de Keltner est un signal d\'explosion réputé.',
    detail:{
      principe:'Les Canaux de Keltner utilisent l\'ATR (volatilité des mèches) plutôt que l\'écart-type (volatilité des clôtures). Les bandes sont donc moins réactives aux spikes ponctuels et donnent une image plus stable de la volatilité.',
      formule:'Médiane  = EMA(close, 20)\nBande haute = EMA + 2 × ATR(14)\nBande basse = EMA − 2 × ATR(14)',
      calcul:['Calculer l\'EMA 20 du prix de clôture','Calculer l\'ATR sur 14 périodes','Multiplier l\'ATR par 2','Ajouter/soustraire à l\'EMA pour les bandes'],
      signaux:['Prix hors des bandes = extrême de volatilité → possible retour','Bandes de Bollinger à l\'INTÉRIEUR de Keltner → squeeze, explosion imminente','Bandes de Bollinger hors de Keltner → forte volatilité en cours','Médiane (EMA) sert de support/résistance dynamique'],
      parametres:[{p:'EMA 20, ATR 14, mult 2',d:'Standard — compromis réactivité/stabilité'},{p:'EMA 20, ATR 14, mult 1.5',d:'Bandes plus serrées — plus de touches'},{p:'EMA 50, ATR 20, mult 2.5',d:'Long terme — tendance majeure'}],
      erreurs:['Confondre avec les Bandes de Bollinger — la formule est différente (ATR vs σ)','Le squeeze Keltner/Bollinger nécessite une direction confirmée avant d\'entrer'],
      pine:`//@version=5
indicator("Keltner Channels", overlay=true)
ema_len = input.int(20, "EMA")
atr_len = input.int(14, "ATR")
mult    = input.float(2.0, "Mult")
mid = ta.ema(close, ema_len)
rng = ta.atr(atr_len) * mult
ph = plot(mid + rng, "Haute", color.purple, 1)
pl = plot(mid - rng, "Basse", color.purple, 1)
plot(mid, "EMA", color.purple, 1, plot.style_line)
fill(ph, pl, color.new(color.purple, 90))`
    }
  },
  {
    id:'vwap', num:6, title:'VWAP', tag:'RÉFÉRENCE', kind:'blue', schema:'vwap',
    principe:['Prix moyen pondéré par le volume depuis l\'ouverture de séance','Remis à zéro à chaque nouvelle séance'],
    usage:'Référence institutionnelle : au-dessus = acheteurs en contrôle. Sert d\'aimant et de zone de retour en intraday.',
    detail:{
      principe:'Le VWAP (Volume Weighted Average Price) est le prix moyen de la journée, pondéré par le volume échangé à chaque prix. C\'est la référence principale des traders institutionnels et des algorithmes. Un prix au-dessus du VWAP indique que les acheteurs ont payé en moyenne plus cher que la moyenne.',
      formule:'VWAP = Σ(Prix_typique × Volume) / Σ(Volume)\n\nPrix typique = (High + Low + Close) / 3\nCalcul cumulatif depuis l\'ouverture de séance',
      calcul:['Pour chaque bougie, calculer le prix typique : (H+L+C)/3','Multiplier par le volume de cette bougie','Cumuler numérateur (TP×V) et dénominateur (V) depuis l\'ouverture','VWAP = cumul_TP_V / cumul_V','Se remet à zéro à l\'ouverture de chaque séance'],
      signaux:['Prix > VWAP → biais haussier intraday, acheteurs dominants','Prix < VWAP → biais baissier intraday, vendeurs dominants','Retour sur VWAP → point d\'entrée classique dans le sens du biais','VWAP = stop mental pour les opérations intraday','Écart important au VWAP → possible retour à la moyenne'],
      parametres:[{p:'Standard (session)',d:'VWAP journalier — référence principale'},{p:'VWAP hebdo/mensuel',d:'Référence pour swing traders et institutions'},{p:'Bandes ±1σ, ±2σ',d:'Zones de surachat/survente autour du VWAP'}],
      erreurs:['Utiliser le VWAP sur des unités de temps trop petites — il perd sa signification','Ignorer qu\'il se remet à zéro : ne pas comparer d\'une séance à l\'autre','Ne pas utiliser en dehors des heures de marché (volume faible = VWAP peu fiable)'],
      pine:`//@version=5
indicator("VWAP", overlay=true)
vwap_val = ta.vwap(hlc3)
plot(vwap_val, "VWAP", color.new(color.blue, 0), 2)
// Bandes
dev = ta.stdev(close, 20)
plot(vwap_val + dev, "VWAP+1σ", color.new(color.blue, 70), 1)
plot(vwap_val - dev, "VWAP-1σ", color.new(color.blue, 70), 1)`
    }
  },
  {
    id:'rsi', num:7, title:'RSI', tag:'MOMENTUM', kind:'neutral', schema:'rsi',
    principe:['Mesure la force du mouvement de 0 à 100 (réglage 14 périodes)','>70 = surachat, <30 = survente'],
    usage:'Repère les excès et les divergences. À confirmer avec la structure — ne pas utiliser isolément.',
    detail:{
      principe:'Le RSI (Relative Strength Index) mesure la vitesse et l\'amplitude des mouvements de prix sur une échelle 0-100. Il compare les gains moyens aux pertes moyennes sur n périodes (méthode Wilder). Un RSI élevé indique que les acheteurs ont dominé récemment.',
      formule:'RS  = Moyenne(gains) / Moyenne(pertes)  [méthode Wilder]\nRSI = 100 − 100 / (1 + RS)\n\nMoyenne Wilder : SMA initiale puis lissage exponentiel',
      calcul:['Calculer les variations journalières : Δ = Close − Close_précédente','Séparer gains (Δ>0) et pertes (Δ<0 en valeur absolue)','Première moyenne : SMA des 14 premières valeurs','Lissage Wilder : Moy(n) = (Moy(n-1) × 13 + Valeur) / 14','Calculer RS puis RSI'],
      signaux:['RSI > 70 → surachat — attention à un retournement ou un ralentissement','RSI < 30 → survente — attention à un rebond','Divergence haussière : prix fait un plus-bas mais RSI fait un moins-bas → signal de retournement','Divergence baissière : prix fait un plus-haut mais RSI fait un moins-haut → essoufflement','RSI 50 : ligne de partage entre dominance acheteurs (>50) et vendeurs (<50)'],
      parametres:[{p:'n = 14',d:'Standard — bon équilibre sensibilité/stabilité'},{p:'n = 7',d:'Plus réactif — scalping, plus de faux signaux'},{p:'n = 21',d:'Plus lisse — swing trading, moins de signaux'}],
      erreurs:['Vendre automatiquement à 70 et acheter à 30 en tendance forte — le RSI peut rester extrême longtemps','Ignorer la divergence qui est le signal le plus puissant','Oublier de regarder le contexte de tendance : RSI 60 en bear market n\'est pas un signal haussier'],
      pine:`//@version=5
indicator("RSI", false)
n   = input.int(14, "Période", minval=1)
r   = ta.rsi(close, n)
plot(r, "RSI", color.teal, 2)
hline(70, "Surachat", color.red,    linestyle=hline.style_dashed)
hline(50, "Neutre",   color.gray,   linestyle=hline.style_dotted)
hline(30, "Survente", color.green,  linestyle=hline.style_dashed)
bgcolor(r >= 70 ? color.new(color.red, 90) : r <= 30 ? color.new(color.green, 90) : na)`
    }
  },
  {
    id:'macd', num:8, title:'MACD', tag:'MOMENTUM', kind:'neutral', schema:'macd',
    principe:['Écart entre EMA 12 et EMA 26 + ligne de signal EMA 9','L\'histogramme montre l\'écart entre MACD et sa ligne de signal'],
    usage:'Croisement MACD × signal = changement de momentum. Histogramme au-dessus/sous zéro = bascule.',
    detail:{
      principe:'Le MACD (Moving Average Convergence Divergence) mesure la convergence et divergence entre deux EMA. Il combine momentum et tendance dans un seul oscillateur. L\'histogramme amplifie visuellement l\'accélération ou le ralentissement du mouvement.',
      formule:'MACD     = EMA(12) − EMA(26)\nSignal   = EMA(MACD, 9)\nHisto    = MACD − Signal',
      calcul:['Calculer EMA 12 (rapide) et EMA 26 (lente) sur les clôtures','MACD = EMA12 − EMA26 : positif si tendance haussière','Signal = EMA du MACD sur 9 périodes','Histogramme = MACD − Signal : mesure la force du momentum','Histogramme vert montant = momentum haussier qui s\'accélère'],
      signaux:['MACD croise Signal par le haut → signal d\'achat','MACD croise Signal par le bas → signal de vente','Histogramme passe de rouge à vert → momentum bascule haussier','Divergence MACD/prix (comme RSI) → signal fort de retournement','MACD au-dessus de zéro = tendance haussière de fond'],
      parametres:[{p:'12 / 26 / 9',d:'Standard — fonctionne sur tous les marchés et timeframes'},{p:'5 / 35 / 5',d:'Variante Bill Williams — plus lisse'},{p:'8 / 21 / 5',d:'Intraday — plus réactif'}],
      erreurs:['Ignorer que le MACD est un indicateur retardé — le croisement arrive après le mouvement','Utiliser seul sans confirmation de structure ou de volume','Confondre un histogramme qui diminue (momentum ralentit) avec un signal de vente'],
      pine:`//@version=5
indicator("MACD", false)
[m, s, h] = ta.macd(close, 12, 26, 9)
plot(m, "MACD",   color.teal,   2)
plot(s, "Signal", color.orange, 2)
plot(h, "Histo",  color.new(h >= 0 ? color.green : color.red, 0), style=plot.style_histogram)
hline(0, "Zéro", color.gray, linestyle=hline.style_dotted)`
    }
  },
  {
    id:'stoch', num:9, title:'Stochastique', tag:'MOMENTUM', kind:'neutral', schema:'stoch',
    principe:['Situe la clôture dans le range récent (0–100) sur 14 périodes','Lignes %K (rapide) et %D (lissée) ; niveaux 80 / 20'],
    usage:'Surachat/survente + croisements %K × %D. Efficace en range, bruyant en forte tendance.',
    detail:{
      principe:'Le Stochastique mesure où se situe le prix de clôture dans le range Haut/Bas des n dernières périodes. Une clôture proche du plus haut indique que les acheteurs contrôlent la fin de bougie (momentum haussier). %D est un lissage de %K.',
      formule:'%K = (Close − Lowest_Low(n)) / (Highest_High(n) − Lowest_Low(n)) × 100\n%D = SMA(%K, 3)\n\nn = 14 (standard)',
      calcul:['Trouver le plus haut et le plus bas sur les 14 dernières périodes','Calculer %K : position relative de la clôture dans ce range','Calculer %D : SMA 3 de %K (lissage)','%K > %D et croisant → momentum haussier','Niveaux clés : 80 (surachat), 20 (survente), 50 (neutre)'],
      signaux:['%K croise %D par le haut en zone de survente (<20) → signal d\'achat','%K croise %D par le bas en zone de surachat (>80) → signal de vente','Divergence stoch/prix → signal de retournement fort','Croisement en dehors des zones extrêmes → signal plus faible'],
      parametres:[{p:'14, 3, 3',d:'Standard — %K 14, lissage %D 3, double lissage 3'},{p:'5, 3, 3',d:'Rapide — scalping, très réactif'},{p:'21, 5, 5',d:'Lent — swing trading, moins de bruit'}],
      erreurs:['Utiliser en tendance forte → le stoch reste en surachat/survente très longtemps','Entrer uniquement sur croisement sans confirmation de structure','Ignorer le contexte de tendance — en uptrend, les signaux de vente sont moins fiables'],
      pine:`//@version=5
indicator("Stochastique", false)
k_len = input.int(14, "%K Période")
d_len = input.int(3,  "%D Lissage")
k = ta.stoch(close, high, low, k_len)
d = ta.sma(k, d_len)
plot(k, "%K", color.teal,   2)
plot(d, "%D", color.orange, 2)
hline(80, "Surachat", color.red,   linestyle=hline.style_dashed)
hline(20, "Survente", color.green, linestyle=hline.style_dashed)`
    }
  },
  {
    id:'atr', num:10, title:'ATR', tag:'VOLATILITÉ', kind:'neutral', schema:'atr',
    principe:['Amplitude moyenne réelle des bougies sur n périodes (défaut 14)','Monte quand le marché s\'agite, baisse au calme'],
    usage:'Ne donne pas de direction. Sert à dimensionner stops et objectifs (ex. stop = 1,5 × ATR).',
    detail:{
      principe:'L\'ATR (Average True Range) mesure la volatilité en calculant l\'amplitude réelle de chaque bougie, en tenant compte des gaps. Le True Range est le plus grand des trois : (H−L), |H−Close_préc.|, |L−Close_préc.|. L\'ATR est la moyenne de ces TR sur n périodes.',
      formule:'True Range (TR) = max(\n  High − Low,\n  |High − Close_précédente|,\n  |Low  − Close_précédente|\n)\nATR = Moyenne_Wilder(TR, 14)',
      calcul:['Calculer le True Range pour chaque bougie (intègre les gaps)','Première ATR = SMA des 14 premiers TR','Lissage Wilder : ATR = (ATR_précédente × 13 + TR_actuel) / 14','L\'ATR est TOUJOURS positif — c\'est une mesure de distance, pas de direction'],
      signaux:['ATR élevé → marché agité, stops plus larges nécessaires','ATR bas → marché calme, possible squeeze avant explosion','Stop = Prix_entrée − 1.5×ATR (ou 2×ATR selon profil de risque)','Objectif = Prix_entrée + 2×ATR ou 3×ATR (ratio R/R)'],
      parametres:[{p:'n = 14',d:'Standard — bon équilibre sur la plupart des marchés'},{p:'n = 7',d:'Plus réactif — intraday, scalping'},{p:'n = 20',d:'Plus stable — swing trading'}],
      erreurs:['Utiliser un ATR fixe peu importe la volatilité du moment → stops inadaptés','Confondre ATR avec une direction — ce n\'est qu\'une mesure d\'amplitude','Placer son stop exactement à 1×ATR → trop proche, souvent touché par le bruit'],
      pine:`//@version=5
indicator("ATR", false)
n   = input.int(14, "Période")
a   = ta.atr(n)
plot(a, "ATR", color.purple, 2)
// Stops dynamiques
plot(close - 1.5 * a, "Stop Long",  color.red,   1, plot.style_circles)
plot(close + 1.5 * a, "Stop Short", color.green, 1, plot.style_circles)`
    }
  },
  {
    id:'adx', num:11, title:'ADX / DMI', tag:'FORCE', kind:'neutral', schema:'adx',
    principe:['ADX mesure la FORCE de la tendance (pas sa direction) de 0 à 100','+DI et −DI indiquent qui domine (acheteurs ou vendeurs)'],
    usage:'ADX > 25 = tendance exploitable. ADX < 20 = range. +DI > −DI = contrôle haussier.',
    detail:{
      principe:'L\'ADX (Average Directional Index) quantifie la force d\'une tendance, sans indiquer sa direction. +DI mesure la pression haussière, −DI la pression baissière. L\'ADX est la moyenne lissée du DX (indice directionnel brut).',
      formule:'+DM = max(0, High − High_préc.)  si +DM > −DM\n−DM = max(0, Low_préc. − Low)   si −DM > +DM\n+DI = 100 × (+DM lissé / ATR lissé)\n−DI = 100 × (−DM lissé / ATR lissé)\nDX  = 100 × |+DI − −DI| / (+DI + −DI)\nADX = Moyenne_Wilder(DX, 14)',
      calcul:['Calculer +DM et −DM pour chaque bougie','Lisser sur 14 périodes (méthode Wilder, comme ATR)','Calculer +DI et −DI en pourcentage','DX = écart relatif entre +DI et −DI','ADX = lissage de DX sur 14 périodes → mesure la force'],
      signaux:['ADX > 25 → tendance forte, opérer dans le sens de +DI/−DI','ADX < 20 → marché sans tendance, éviter les stratégies de suivi','ADX monte + +DI > −DI → tendance haussière s\'accélère','ADX monte + −DI > +DI → tendance baissière s\'accélère','ADX culmine puis baisse → tendance s\'essouffle'],
      parametres:[{p:'n = 14',d:'Standard Wilder — fonctionne sur tous les marchés'},{p:'n = 7',d:'Plus réactif — signaux plus précoces mais moins fiables'},{p:'Seuil 25 vs 20',d:'25 = tendance exploitable ; 20 = début de tendance'}],
      erreurs:["Confondre ADX et direction — un ADX à 40 peut être baissier",'Entrer dès que ADX > 25 sans regarder +DI/−DI → sans direction, c\'est inutile','L\'ADX est très lent — il confirme une tendance déjà bien établie'],
      pine:`//@version=5
indicator("ADX / DMI", false)
n          = input.int(14, "Période")
[p, m, a]  = ta.dmi(n, n)
plot(a, "ADX", color.black, 2)
plot(p, "+DI", color.green, 1)
plot(m, "−DI", color.red,   1)
hline(25, "Tendance", color.gray, linestyle=hline.style_dashed)`
    }
  },
  {
    id:'supertrend', num:12, title:'SuperTrend', tag:'SUIVI', kind:'bull', schema:'supertrend',
    principe:['Ligne basée sur l\'ATR placée sous le prix (hausse) ou au-dessus (baisse)','Bascule de couleur (vert → rouge) au changement de tendance'],
    usage:'Ligne verte sous le prix → tenir le long. Bascule rouge → sortie ou short. Excellent stop suiveur.',
    detail:{
      principe:'Le SuperTrend combine l\'ATR avec le point médian pour créer une ligne de tendance dynamique. En hausse, la ligne est sous le prix (support) ; en baisse, au-dessus (résistance). Un flip de couleur signale un retournement de tendance.',
      formule:'Médiane = (High + Low) / 2\nBande haute = Médiane + (multiplicateur × ATR)\nBande basse  = Médiane − (multiplicateur × ATR)\nFlip : si Close > Bande haute précédente → tendance haussière\n       si Close < Bande basse précédente  → tendance baissière',
      calcul:['Calculer ATR sur 10 périodes','Calculer la bande haute : (H+L)/2 + 3×ATR','Calculer la bande basse : (H+L)/2 − 3×ATR','Ajuster les bandes pour qu\'elles ne s\'inversent pas','Comparer la clôture avec la bande pour déterminer la direction'],
      signaux:['Ligne verte sous le prix → tendance haussière, rester long','Ligne rouge au-dessus du prix → tendance baissière, rester short','Flip vert → rouge : signal de sortie long ou entrée short','Flip rouge → vert : signal de sortie short ou entrée long','Utiliser comme stop suiveur : déplacer son stop à la valeur du SuperTrend'],
      parametres:[{p:'ATR 10, mult 3',d:'Standard — bon équilibre sensibilité/stabilité'},{p:'ATR 7, mult 2',d:'Plus réactif — plus de flips, intraday'},{p:'ATR 14, mult 4',d:'Moins de signaux — swing trading long terme'}],
      erreurs:['En range ou marché choppy → multiples faux flips coûteux','Utiliser seul sans contexte de tendance de fond','Négliger le multiplicateur ATR — trop faible = trop de bruit, trop fort = stops trop larges'],
      pine:`//@version=5
indicator("SuperTrend", overlay=true)
atr_len = input.int(10, "ATR")
mult    = input.float(3.0, "Mult")
[st, dir] = ta.supertrend(mult, atr_len)
col = dir < 0 ? color.green : color.red
plot(st, "SuperTrend", col, 2)
bgcolor(dir < 0 ? color.new(color.green, 95) : color.new(color.red, 95))`
    }
  },
  {
    id:'ichimoku', num:13, title:'Ichimoku Kinko Hyo', tag:'SYSTÈME', kind:'neutral', schema:'ichimoku',
    principe:['Système complet : Tenkan (9), Kijun (26) et un nuage (Kumo) Senkou A/B','Le nuage projette support et résistance dans le futur'],
    usage:'Prix au-dessus du nuage = haussier. Nuage épais = zone solide. Lecture d\'ensemble du marché.',
    detail:{
      principe:'L\'Ichimoku est un système complet développé par Goichi Hosoda. Il donne en un coup d\'œil la tendance, le momentum, les supports/résistances et les points d\'entrée. Le nuage (Kumo) est projeté 26 périodes dans le futur.',
      formule:'Tenkan-sen  = (Max(9) + Min(9)) / 2\nKijun-sen   = (Max(26) + Min(26)) / 2\nSenkou A    = (Tenkan + Kijun) / 2  [décalé +26]\nSenkou B    = (Max(52) + Min(52)) / 2 [décalé +26]\nChikou     = Close décalé −26 périodes',
      calcul:['Tenkan : milieu du range des 9 dernières périodes (momentum court)','Kijun : milieu du range des 26 dernières périodes (tendance)','Senkou A : moyenne Tenkan/Kijun, projetée 26 périodes en avance','Senkou B : milieu du range des 52 périodes, projetée 26 en avance','Nuage vert si Senkou A > B (haussier), rouge si A < B (baissier)'],
      signaux:['Prix > Nuage → haussier ; Prix < Nuage → baissier ; Prix dans le nuage → indécision','Tenkan croise Kijun par le haut (TK Cross) → signal haussier de momentum','Prix croise Kijun → signal fort de changement de tendance','Nuage épais → support/résistance solide ; Nuage fin → zone fragile','Chikou > Prix d\'il y a 26 périodes → confirmation haussière'],
      parametres:[{p:'9 / 26 / 52',d:'Paramètres originaux — marchés asiatiques (6 jours/semaine)'},{p:'7 / 22 / 44',d:'Adaptation marchés 5 jours/semaine'},{p:'10 / 30 / 60',d:'Variante plus lisse pour crypto'}],
      erreurs:['Ignorer le nuage projeté — c\'est la force principale de l\'Ichimoku','Utiliser séparément sans lire l\'ensemble du système','Sur-analyser chaque ligne isolément — l\'Ichimoku se lit globalement'],
      pine:`//@version=5
indicator("Ichimoku", overlay=true)
t_len = input.int(9,  "Tenkan"); k_len = input.int(26, "Kijun"); s_len = input.int(52, "Senkou B")
tenkan  = math.avg(ta.highest(high, t_len), ta.lowest(low, t_len))
kijun   = math.avg(ta.highest(high, k_len), ta.lowest(low, k_len))
senkA   = math.avg(tenkan, kijun)
senkB   = math.avg(ta.highest(high, s_len), ta.lowest(low, s_len))
plot(tenkan, "Tenkan", color.blue,   1)
plot(kijun,  "Kijun",  color.orange, 1)
pA = plot(senkA, offset=k_len)
pB = plot(senkB, offset=k_len)
fill(pA, pB, senkA > senkB ? color.new(color.green,80) : color.new(color.red,80))`
    }
  },
  {
    id:'sar', num:14, title:'Parabolic SAR', tag:'SUIVI', kind:'neutral', schema:'sar',
    principe:['Points qui suivent le prix : en dessous en hausse, au-dessus en baisse','Se resserrent quand la tendance accélère (facteur AF croissant)'],
    usage:'Retournement des points = signal de sortie ou inversion. Excellent stop suiveur. Inutile en range.',
    detail:{
      principe:'Le Parabolic SAR (Stop And Reverse) génère des points qui servent à la fois de stop suiveur et de signal d\'inversion. Le facteur d\'accélération (AF) augmente à chaque nouveau sommet/creux extrême, ce qui rapproche les points du prix en tendance forte.',
      formule:'SAR(n) = SAR(n-1) + AF × (EP − SAR(n-1))\n\nAF  = facteur d\'accélération (0.02 → 0.20)\nEP  = point extrême (plus haut en hausse, plus bas en baisse)\nInversion si prix franchit le SAR',
      calcul:['Initialiser : SAR = premier creux (hausse) ou premier sommet (baisse)','AF démarre à 0.02, augmente de 0.02 à chaque nouveau EP, max 0.20','En hausse : SAR monte progressivement, ne peut pas dépasser les 2 creux précédents','Si le prix touche le SAR → inversion : nouveau SAR = ancien EP'],
      signaux:['Points sous le prix → tendance haussière, tenir les longs','Points au-dessus du prix → tendance baissière, tenir les shorts','Retournement des points → signal de sortie et possible entrée inverse','Resserrement rapide des points → accélération de la tendance'],
      parametres:[{p:'AF 0.02, max 0.20',d:'Standard Wilder'},{p:'AF 0.01, max 0.10',d:'Plus lent — moins de retournements'},{p:'AF 0.03, max 0.30',d:'Plus agressif — suit plus près le prix'}],
      erreurs:['Utiliser en range → retournements constants, pertes continues','Ignorer qu\'en début de tendance l\'AF est faible et le SAR peut être loin du prix','Prendre chaque retournement comme entrée systématique sans confirmation'],
      pine:`//@version=5
indicator("Parabolic SAR", overlay=true)
af_start = input.float(0.02, "AF Start")
af_inc   = input.float(0.02, "AF Incrément")
af_max   = input.float(0.20, "AF Max")
sar      = ta.sar(af_start, af_inc, af_max)
plot(sar, "SAR", na, 0, plot.style_circles)
col = close > sar ? color.green : color.red
plotchar(sar, ".", "•", location.absolute, col, size=size.tiny)`
    }
  },
  {
    id:'combine', num:15, title:'Combiner les Indicateurs', tag:'MÉTHODE', kind:'bull', schema:'combine',
    principe:['Un indicateur par famille : tendance + momentum + volatilité','Éviter d\'empiler 3 indicateurs qui donnent la même information'],
    usage:'Chercher la confluence (EMA haussière + RSI qui rebondit). Plus d\'indicateurs ≠ plus de précision.',
    detail:{
      principe:'Combiner des indicateurs de familles différentes crée une confluence de signaux qui augmente la probabilité d\'une trade gagnante. L\'erreur commune est d\'utiliser plusieurs indicateurs redondants (ex : RSI + Stoch + MACD = trois mesures du même momentum).',
      formule:'Setup type :\n• Tendance  : EMA 20 / 50 (filtre de direction)\n• Momentum : RSI 14 (timing d\'entrée)\n• Volatilité: ATR 14 (dimensionnement du stop)\n• Structure : niveaux clés, support/résistance',
      calcul:['1. Filtre de tendance : EMA → définit le biais directionnel','2. Momentum : RSI → timing d\'entrée (rebond depuis zone de survente en uptrend)','3. Volatilité : ATR → calcul du stop loss (1.5-2×ATR)','4. Confirmation : volume ou structure chartiste','Entrer SEULEMENT quand tous les filtres sont alignés'],
      signaux:['Setup haussier idéal : Prix > EMA50, RSI remonte depuis 40-50, ATR stable','Setup baissier : Prix < EMA50, RSI redescend depuis 60-50','Confluence = plusieurs feux verts simultanés → probabilité plus haute','Contradiction entre indicateurs → attendre, ne pas forcer le trade'],
      parametres:[{p:'Tendance + Momentum',d:'Combo minimum — EMA + RSI'},{p:'Tendance + Momentum + Vol.',d:'Combo complet — EMA + RSI/MACD + ATR'},{p:'+ Structure',d:'Combo avancé — ajouter niveaux clés et figures chartistes'}],
      erreurs:['Utiliser 5 indicateurs qui mesurent tous le momentum = sur-analyse redondante','Ignorer la structure de marché (supports, résistances, tendance de fond)','Chercher la confirmation parfaite → over-analyse et paralysie'],
      pine:`//@version=5
indicator("Combo EMA+RSI", overlay=true)
// Tendance
ema50 = ta.ema(close, 50)
plot(ema50, "EMA 50", color.orange, 2)
// Momentum RSI dans sous-fenêtre séparée
// → ajouter un indicateur RSI séparé dans TradingView
// Signal combiné
bias_up = close > ema50
rsi_val = ta.rsi(close, 14)
long_ok = bias_up and rsi_val < 45 and rsi_val[1] < rsi_val  // RSI rebondit en uptrend
plotshape(long_ok, "Long ?", shape.triangleup, location.belowbar, color.green)`
    }
  }
];

const FIGURES = [
  {
    id:'tri_asc', num:1, title:'Triangle Ascendant', tag:'CONTINUATION · HAUSSIER', kind:'bull', schema:'tri_asc',
    principe:['Résistance plate touchée plusieurs fois','Creux de plus en plus hauts (support oblique montant)'],
    usage:'Cassure par le haut → poursuite de la hausse. Objectif = hauteur de la base reportée vers le haut.',
    detail:{
      principe:'Le triangle ascendant est une figure de continuation haussière. Les acheteurs poussent les bas de plus en plus haut (pression croissante) tandis que les vendeurs défendent une résistance horizontale. La pression haussière finit par l\'emporter.',
      formule:'Objectif = Prix cassure + Hauteur base\nHauteur base = Résistance − Premier creux du triangle',
      calcul:['Identifier une résistance horizontale touchée 2+ fois','Tracer la ligne de support oblique reliant les creux montants','Attendre la cassure franche de la résistance avec clôture','Mesurer la hauteur à la base du triangle','Reporter cette hauteur à partir du point de cassure'],
      signaux:['Cassure avec volume en hausse → confirmation forte','Retest de la résistance cassée (devenue support) → point d\'entrée','Volume décroissant pendant la formation → classique','Cassure sans volume → prudence, possible faux signal'],
      parametres:[{p:'Durée',d:'Minimum 3-4 touchées de chaque ligne (2-8 semaines classique)'},{p:'Angle support',d:'Montant mais pas trop raide — les creux progressent régulièrement'},{p:'Cassure',d:'Clôture franche au-dessus + volume idéalement en hausse'}],
      erreurs:['Entrer avant la cassure (anticipation) — le prix peut repartir dans la figure','Négliger le volume à la cassure','Ignorer le contexte de tendance — plus fiable si la tendance globale est haussière'],
      pine:`// Identification manuelle sur graphique — pas d'automatisation fiable
// Utiliser les outils de dessin TradingView :
// → Outil "Trendline" pour support oblique
// → Outil "Horizontal line" pour résistance
// → Outil "Price Range" pour mesurer l'objectif`
    }
  },
  {
    id:'tri_desc', num:2, title:'Triangle Descendant', tag:'CONTINUATION · BAISSIER', kind:'bear', schema:'tri_desc',
    principe:['Support plat touché plusieurs fois','Sommets de plus en plus bas (résistance oblique descendante)'],
    usage:'Cassure par le bas → poursuite de la baisse. Objectif = hauteur de la base reportée vers le bas.',
    detail:{
      principe:'Le symétrique baissier du triangle ascendant. Les vendeurs abaissent progressivement leurs offres (pression baissière croissante) tandis que les acheteurs défendent un support horizontal. La pression baissière finit par briser le support.',
      formule:'Objectif = Prix cassure − Hauteur base\nHauteur base = Premier sommet − Support horizontal',
      calcul:['Identifier un support horizontal touché 2+ fois','Tracer la ligne de résistance oblique reliant les sommets descendants','Attendre la cassure franche du support','Mesurer la hauteur à la base','Reporter vers le bas'],
      signaux:['Cassure du support avec volume → confirmation','Clôture en dessous → validation','Retest du support cassé (devenu résistance) → point d\'entrée short','Chaque rebond de plus en plus faible → pression baissière croissante'],
      parametres:[{p:'Durée',d:'2-8 semaines, minimum 4 touchées'},{p:'Angle résistance',d:'Descendant régulier'},{p:'Volume',d:'Décroissant pendant la figure, expansion à la cassure'}],
      erreurs:['Vendre avant la cassure — le support peut tenir','Ignorer un contexte de tendance globale haussière qui rend la cassure moins fiable'],
      pine:`// Identification visuelle — outils de dessin TradingView
// Support horizontal + résistance oblique descendante`
    }
  },
  {
    id:'tri_sym', num:3, title:'Triangle Symétrique', tag:'CONTINUATION · NEUTRE', kind:'neutral', schema:'tri_sym',
    principe:['Sommets descendants + creux montants','Les deux obliques convergent vers un apex'],
    usage:'Cassure dans le sens de la tendance précédente. Objectif = hauteur de la base reportée.',
    detail:{
      principe:'Le triangle symétrique représente une phase d\'indécision. La pression haussière et baissière s\'équilibrent, créant des sommets de plus en plus bas et des creux de plus en plus hauts. La résolution se fait généralement dans le sens de la tendance précédente.',
      formule:'Objectif = Prix cassure ± Hauteur base\nDirection probable = sens de la tendance avant la figure',
      calcul:['Identifier les sommets descendants et creux montants','Tracer les deux lignes convergeant vers l\'apex','Observer le sens de la cassure','Mesurer la hauteur à la base et reporter'],
      signaux:['Cassure avant les 2/3 de la distance vers l\'apex → signal classique','Cassure trop proche de l\'apex → signal faible','Fausse cassure possible avant la vraie — attendre la clôture'],
      parametres:[{p:'Symétrie',d:'Les deux obliques ont une pente comparable'},{p:'Durée',d:'Minimum 4 touchées au total (2 par ligne)'},{p:'Volume',d:'Décroissant vers l\'apex, hausse à la cassure'}],
      erreurs:['Miser sur une direction avant la cassure — c\'est NEUTRE','Entrer trop tôt sur une mèche qui dépasse'],
      pine:`// Identification visuelle — triangles symétriques`
    }
  },
  {
    id:'canal_h', num:4, title:'Canal Haussier', tag:'TENDANCE · HAUSSIER', kind:'bull', schema:'canal_h',
    principe:['Deux lignes parallèles inclinées vers le haut','Rebonds sur la ligne basse (support), ventes sur la haute (résistance)'],
    usage:'Biais haussier maintenu. On joue les rebonds sur le support. Cassure sous la ligne basse = alerte.',
    detail:{
      principe:'Le canal haussier est une tendance ordonnée où le prix oscille entre deux parallèles montantes. La ligne basse est le support, la ligne haute la résistance. On peut acheter les rebonds sur le support et vendre (partiellement) à la résistance.',
      formule:'Support oblique : relie les creux ascendants\nRésistance oblique : parallèle au support, passe par les sommets\nObjectif cassure haussière : largeur du canal reportée vers le haut',
      calcul:['Relier 2+ creux croissants pour le support','Tracer une parallèle passant par 2+ sommets','Jouer les rebonds sur le support avec stop sous le dernier creux','Sortir/alléger à la résistance','Cassure sous le support = possible retournement'],
      signaux:['Rebond sur support oblique + volume faible → entrée en continuation','Échec à atteindre la résistance → canal peut se casser','Cassure haussière de la résistance → accélération possible'],
      parametres:[{p:'Parallélisme',d:'Les deux lignes doivent être vraiment parallèles'},{p:'Touchées',d:'Minimum 2 par ligne pour valider'},{p:'Inclinaison',d:'Modérée — trop raide = fragile'}],
      erreurs:['Tracer des lignes non parallèles (c\'est un biseau, pas un canal)','Ignorer une rupture du support en espérant un retour'],
      pine:`// Canal = 2 trendlines parallèles tracées manuellement`
    }
  },
  {
    id:'canal_b', num:5, title:'Canal Baissier', tag:'TENDANCE · BAISSIER', kind:'bear', schema:'canal_b',
    principe:['Deux lignes parallèles inclinées vers le bas','Rebonds sous la résistance haute, nouveaux bas sur le support'],
    usage:'Biais baissier maintenu. Cassure au-dessus de la résistance = retournement possible.',
    detail:{
      principe:'Le canal baissier est la version symétrique baissière. Les vendeurs contrôlent, les rebonds sont des opportunités de vente. La cassure de la résistance est le signal de renversement le plus important.',
      formule:'Résistance oblique : relie les sommets descendants\nSupport oblique : parallèle à la résistance, passe par les creux\nObjectif cassure haussière = largeur du canal reportée',
      calcul:['Relier 2+ sommets décroissants pour la résistance','Tracer le support parallèle passant par 2+ creux','Vendre les rebonds sous la résistance','Cassure franche de la résistance → signal de retournement'],
      signaux:['Rebond sous la résistance avec clôture rouge → vente','Volume croissant à la cassure haussière → confirmation retournement','Retest de la résistance cassée = support → entrée long'],
      parametres:[{p:'Parallélisme',d:'Critère de validité du canal'},{p:'Durée',d:'Plus long = plus significatif'},{p:'Cassure',d:'Clôture franche + volume'}],
      erreurs:['Shorter un canal trop mûr proche d\'une zone de support majeur','Manquer la cassure haussière par excès de conviction baissière'],
      pine:`// Canal baissier = 2 trendlines parallèles descendantes`
    }
  },
  {
    id:'range', num:6, title:'Range Horizontal', tag:'CONSOLIDATION · NEUTRE', kind:'neutral', schema:'range',
    principe:['Support et résistance horizontaux délimitant une zone de consolidation','Phase d\'indécision entre acheteurs et vendeurs'],
    usage:'Le mouvement part dans le sens de la cassure. Objectif = hauteur du range reportée.',
    detail:{
      principe:'Le range est une phase de consolidation horizontale où ni les acheteurs ni les vendeurs ne prennent le contrôle. Il peut précéder une continuation ou un retournement. La cassure d\'un côté déclenche le signal.',
      formule:'Résistance = niveau horizontal touché 2+ fois par les sommets\nSupport    = niveau horizontal touché 2+ fois par les creux\nObjectif   = Résistance − Support (hauteur), reportée depuis la cassure',
      calcul:['Identifier résistance et support horizontaux','Attendre 2+ touchées de chaque niveau','Observer le volume : décroissant dans le range','Attendre cassure franche avec clôture + volume en hausse','Reporter la hauteur du range depuis le point de cassure'],
      signaux:['Volume croissant à la cassure → confirmation','Retest du niveau cassé → point d\'entrée optimal','Cassure baissière depuis un range après une hausse → distribution','Cassure haussière depuis un range après une baisse → accumulation'],
      parametres:[{p:'Largeur',d:'Plus le range est large et long, plus la cassure est explosive'},{p:'Nombre touchées',d:'2 minimum, 3-4 idéalement pour chaque niveau'},{p:'Volume',d:'Doit augmenter significativement à la cassure'}],
      erreurs:['Trader l\'intérieur du range avec des stops trop serrés','Entrer sur la cassure sans attendre la clôture (risque de fausse cassure)','Ignorer le contexte : un range en sommet de tendance est souvent une distribution'],
      pine:`// Range = support + résistance horizontaux
// Détecter automatiquement avec l'outil "Box" de TradingView`
    }
  },
  {
    id:'hs', num:7, title:'Tête-Épaules', tag:'RETOURNEMENT · BAISSIER', kind:'bear', schema:'hs',
    principe:['Une tête haute (sommet central) entre deux épaules plus basses','Ligne de cou tracée sous les deux creux encadrant la tête'],
    usage:'Cassure de la ligne de cou → signal baissier. Objectif = distance tête-cou reportée vers le bas.',
    detail:{
      principe:'Le Tête-Épaules est la figure de retournement baissier la plus connue. Elle marque l\'épuisement d\'une tendance haussière : les acheteurs font un dernier plus haut (tête) mais échouent à dépasser lors de la deuxième tentative (épaule droite). La cassure de la ligne de cou confirme le retournement.',
      formule:'Ligne de cou = droite reliant les deux creux (entre épaules et tête)\nObjectif = Prix ligne de cou − (Prix tête − Prix ligne de cou)',
      calcul:['Identifier 3 sommets : épaule gauche, tête (plus haute), épaule droite','Tracer la ligne de cou reliant les deux creux intermédiaires','Attendre la cassure franche de la ligne de cou','Mesurer la distance verticale tête → ligne de cou','Reporter cette distance vers le bas depuis la cassure'],
      signaux:['Épaule droite ne dépasse pas la tête → signal de faiblesse','Volume : épaule gauche fort, tête modéré, épaule droite faible = classique','Cassure avec volume en hausse → confirmation','Retest de la ligne de cou cassée (devenue résistance) → entrée short'],
      parametres:[{p:'Symétrie',d:'Épaules à peu près au même niveau — plus c\'est symétrique, plus c\'est fiable'},{p:'Ligne de cou',d:'Peut être légèrement inclinée'},{p:'Durée',d:'Quelques semaines à quelques mois'}],
      erreurs:['Shorter avant la cassure de la ligne de cou','Négliger le retest — souvent le meilleur point d\'entrée','Figure invalide si l\'épaule droite dépasse la tête'],
      pine:`// Tête-Épaules : identification visuelle
// 1. Marquer les 3 sommets avec les outils de dessin
// 2. Tracer la ligne de cou
// 3. Placer alerte sur la cassure`
    }
  },
  {
    id:'hs_inv', num:8, title:'Tête-Épaules Inversée', tag:'RETOURNEMENT · HAUSSIER', kind:'bull', schema:'hs_inv',
    principe:['Une tête basse entre deux épaules moins profondes','Ligne de cou au-dessus reliant les deux sommets intermédiaires'],
    usage:'Cassure de la ligne de cou → signal haussier. Objectif = distance tête-cou reportée vers le haut.',
    detail:{
      principe:'Figure miroir du Tête-Épaules classique. Elle apparaît après une tendance baissière et signale un retournement haussier. Les vendeurs font un dernier plus bas (tête) mais l\'épaule droite ne descend pas aussi bas, signe de perte de pression baissière.',
      formule:'Ligne de cou = droite reliant les deux sommets intermédiaires\nObjectif = Prix ligne de cou + (Prix ligne de cou − Prix tête)',
      calcul:['Identifier 3 creux : épaule gauche, tête (plus basse), épaule droite','Tracer la ligne de cou sur les deux sommets','Attendre la cassure et clôture au-dessus','Reporter la distance tête → ligne de cou vers le haut'],
      signaux:['Volume idéalement fort sur la tête, décroissant sur l\'épaule droite','Cassure de la ligne de cou avec accélération du volume → fort signal','Retest de la ligne de cou (devenu support) → entrée long'],
      parametres:[{p:'Symétrie',d:'Épaules comparables en profondeur'},{p:'Volume',d:'Croissant à la cassure haussière'},{p:'Durée',d:'Quelques semaines à quelques mois'}],
      erreurs:['Acheter avant la cassure','Ignorer le contexte — figure plus fiable après une longue tendance baissière'],
      pine:`// Tête-Épaules inversée : identification visuelle
// Miroir du H&S classique`
    }
  },
  {
    id:'double_top', num:9, title:'Double Sommet', tag:'RETOURNEMENT · BAISSIER', kind:'bear', schema:'double_top',
    principe:['Deux sommets au même niveau (forme en M)','Échec répété à franchir la résistance'],
    usage:'Cassure sous la ligne de cou (creux central) → baisse. Objectif = hauteur de la figure reportée.',
    detail:{
      principe:'Le double sommet (forme en M) est un signal de retournement baissier. Le prix tente deux fois de franchir une résistance et échoue les deux fois. La cassure du creux central (ligne de cou) confirme l\'épuisement haussier.',
      formule:'Ligne de cou = creux entre les deux sommets\nObjectif = Ligne de cou − (Sommet − Ligne de cou)',
      calcul:['Identifier deux sommets proches du même niveau','Repérer le creux entre les deux sommets (ligne de cou)','Attendre cassure franche sous la ligne de cou','Reporter la hauteur (sommet → ligne de cou) vers le bas'],
      signaux:['2e sommet légèrement plus bas → signal de faiblesse accru','Volume décroissant sur le 2e sommet → classique','Cassure avec volume → confirmation','Retest de la ligne de cou cassée → entrée short'],
      parametres:[{p:'Écart sommets',d:'Idéalement quelques semaines entre les deux sommets'},{p:'Niveau sommets',d:'Proches mais pas forcément identiques (±1-2%)'},{p:'Ligne de cou',d:'Horizontale ou légèrement inclinée'}],
      erreurs:['Shorter après le 2e sommet AVANT la cassure','Confondre avec une simple consolidation en range'],
      pine:`// Double sommet : 2 sommets similaires + cassure du creux`
    }
  },
  {
    id:'double_bot', num:10, title:'Double Creux', tag:'RETOURNEMENT · HAUSSIER', kind:'bull', schema:'double_bot',
    principe:['Deux creux au même niveau (forme en W)','Le support tient deux fois — les vendeurs s\'épuisent'],
    usage:'Cassure au-dessus de la ligne de cou (sommet central) → hausse. Objectif = hauteur reportée.',
    detail:{
      principe:'Le double creux (forme en W) est le signal de retournement haussier symétrique du double sommet. Le support est testé deux fois. L\'échec des vendeurs à créer un nouveau plus bas signale un renversement de dynamique.',
      formule:'Ligne de cou = sommet entre les deux creux\nObjectif = Ligne de cou + (Ligne de cou − Creux)',
      calcul:['Identifier deux creux proches du même niveau','Repérer le sommet entre les deux creux (ligne de cou)','Attendre cassure franche au-dessus de la ligne de cou','Reporter la hauteur vers le haut'],
      signaux:['2e creux légèrement plus haut → signal de force accru','Volume croissant sur la montée du 2e creux → confirmation','Cassure avec accélération → signal fort','Retest de la ligne de cou (devenu support) → entrée long'],
      parametres:[{p:'Durée',d:'Quelques semaines minimum entre les deux creux'},{p:'Niveau creux',d:'Proches (±1-2%)'},{p:'Volume',d:'Idéalement croissant sur la 2e montée'}],
      erreurs:['Acheter sur le 2e creux avant la cassure de la ligne de cou','Figure plus faible si le contexte de tendance global est encore baissier'],
      pine:`// Double creux : 2 creux similaires + cassure du sommet central`
    }
  },
  {
    id:'wedge_r', num:11, title:'Biseau Ascendant', tag:'RETOURNEMENT · BAISSIER', kind:'bear', schema:'wedge_r',
    principe:['Deux lignes montantes qui convergent (lignes haute et basse toutes deux en hausse)','La ligne basse monte plus vite que la haute → espace se réduit'],
    usage:'Sortie par le bas malgré la pente montante. Objectif = retour vers la base du biseau.',
    detail:{
      principe:'Le biseau ascendant est une figure trompeuse : malgré une apparence haussière (les deux lignes montent), la convergence trahit un essoufflement des acheteurs. Les vendeurs gagnent progressivement du terrain. La cassure est baissière.',
      formule:'Lignes convergentes montantes\nObjectif cassure = Prix cassure − Hauteur base du biseau\nBase = largeur maximale au début de la figure',
      calcul:['Tracer 2 lignes montantes convergeant vers un apex','Ligne haute relie les sommets, ligne basse relie les creux','Les deux lignes montent mais convergent (la basse monte plus vite)','Cassure sous la ligne basse → signal baissier','Reporter la hauteur de la base vers le bas'],
      signaux:['Volume décroissant pendant la formation → classique','Cassure brutale sous la ligne basse + volume → confirmation','Chaque swing interne monte moins haut → épuisement progressif'],
      parametres:[{p:'Convergence',d:'Les lignes DOIVENT converger — sinon c\'est un canal'},{p:'Durée',d:'Quelques semaines à plusieurs mois'},{p:'Inclinaison',d:'Les deux lignes montent, mais la basse monte plus'}],
      erreurs:['Acheter parce que "ça monte" — la pente est trompeuse','Confondre avec un canal haussier (lignes parallèles)'],
      pine:`// Biseau ascendant = 2 trendlines convergentes montantes`
    }
  },
  {
    id:'wedge_f', num:12, title:'Biseau Descendant', tag:'RETOURNEMENT · HAUSSIER', kind:'bull', schema:'wedge_f',
    principe:['Deux lignes descendantes qui convergent','La ligne haute descend plus vite que la basse → espace se réduit'],
    usage:'Sortie par le haut malgré la pente descendante. Objectif = retour vers la base du biseau.',
    detail:{
      principe:'Le biseau descendant est la figure miroir haussière. Malgré l\'apparence baissière, les vendeurs s\'épuisent progressivement. La convergence signale que leur pression diminue. La cassure haussière est le signal.',
      formule:'Lignes convergentes descendantes\nObjectif cassure = Prix cassure + Hauteur base du biseau',
      calcul:['Deux lignes descendantes qui convergent','Ligne haute descend plus vite → espace se réduit','Cassure au-dessus de la ligne haute → signal haussier','Reporter la hauteur de la base vers le haut'],
      signaux:['Volume décroissant → manque de conviction baissière','Cassure avec fort volume → signal puissant','Mèches haussières de plus en plus longues → acheteurs reviennent'],
      parametres:[{p:'Convergence',d:'Critère essentiel'},{p:'Durée',d:'Quelques semaines à plusieurs mois'},{p:'Volume',d:'Décroissant puis explosion à la cassure'}],
      erreurs:['Shorter parce que "ça descend"','Confondre avec un canal baissier (lignes parallèles)'],
      pine:`// Biseau descendant = 2 trendlines convergentes descendantes`
    }
  },
  {
    id:'bull_flag', num:13, title:'Drapeau Haussier', tag:'CONTINUATION · HAUSSIER', kind:'bull', schema:'bull_flag',
    principe:['Forte impulsion haussière (le mât) suivie d\'un petit canal incliné à la baisse','Volume décroissant pendant la pause — signe de reprise saine'],
    usage:'Cassure de la résistance du drapeau → reprise de la hausse. Objectif = longueur du mât reportée.',
    detail:{
      principe:'Le drapeau haussier est une figure de continuation rapide. Après une forte hausse (le mât), le prix consolide légèrement à contre-sens dans un petit canal incliné vers le bas. C\'est une pause saine avant la continuation.',
      formule:'Objectif = Point de cassure + Longueur du mât\nMât = de la base au sommet de l\'impulsion initiale',
      calcul:['Identifier le mât : forte hausse rapide à fort volume','Tracer le petit canal de consolidation (incliné légèrement vers le bas)','Attendre la cassure de la ligne haute du drapeau','Mesurer le mât depuis sa base','Reporter depuis la cassure'],
      signaux:['Volume faible pendant la consolidation → sain (pas de distribution)','Volume explose à la cassure → confirmation forte','Durée du drapeau : court (quelques jours à 2 semaines) → plus court = plus fort'],
      parametres:[{p:'Mât',d:'Impulsion rapide et forte (>3-5% en quelques bougies)'},{p:'Drapeau',d:'Canal légèrement incliné à contre-sens, volume décroissant'},{p:'Durée',d:'Plus le drapeau est court, plus le signal est fiable'}],
      erreurs:['Consolidation trop longue → n\'est plus un drapeau','Canal incliné vers le HAUT → c\'est un biseau, pas un drapeau','Entrer sans le mât précédent (impulsion)'],
      pine:`// Drapeau haussier : mât + consolidation courte + cassure`
    }
  },
  {
    id:'bear_flag', num:14, title:'Drapeau Baissier', tag:'CONTINUATION · BAISSIER', kind:'bear', schema:'bear_flag',
    principe:['Forte chute (le mât) suivie d\'un rebond technique dans un petit canal incliné vers le haut','Volume faible sur le rebond — pas de vraie reprise'],
    usage:'Cassure de la ligne basse du drapeau → reprise de la baisse. Objectif = longueur du mât.',
    detail:{
      principe:'Symétrique baissier du drapeau haussier. Après une forte baisse, le prix rebondit légèrement dans un petit canal montant à faible volume. C\'est un rebond technique sans conviction, suivi d\'une reprise de la baisse.',
      formule:'Objectif = Point de cassure − Longueur du mât',
      calcul:['Identifier le mât : forte baisse rapide','Tracer le canal de rebond incliné vers le haut','Attendre la cassure de la ligne basse du drapeau','Reporter la longueur du mât vers le bas'],
      signaux:['Volume faible pendant le rebond → pas de vraie demande','Cassure à la baisse avec volume → signal fort','Bougies de plus en plus petites pendant le drapeau → épuisement'],
      parametres:[{p:'Mât',d:'Forte baisse rapide à fort volume'},{p:'Drapeau',d:'Rebond à contre-sens, volume décroissant'},{p:'Durée',d:'Quelques jours à 2 semaines maximum'}],
      erreurs:['Shorter avant la cassure du canal','Canal incliné vers le BAS → ce n\'est pas un drapeau baissier'],
      pine:`// Drapeau baissier : mât baissier + rebond court + cassure`
    }
  },
  {
    id:'pennant', num:15, title:'Fanion (Pennant)', tag:'CONTINUATION · NEUTRE', kind:'neutral', schema:'pennant',
    principe:['Mât marqué + très court triangle symétrique de consolidation','Consolidation très rapide avant continuation'],
    usage:'Continuation dans le sens du mât. Objectif = longueur du mât reportée depuis la cassure.',
    detail:{
      principe:'Le fanion est similaire au drapeau mais la consolidation prend la forme d\'un triangle symétrique plutôt qu\'un canal parallèle. La pause est encore plus courte et la continuation est souvent explosive.',
      formule:'Objectif = Point de cassure ± Longueur du mât\n(direction selon le sens du mât)',
      calcul:['Identifier le mât (forte impulsion)','Tracer le petit triangle symétrique de consolidation','Deux lignes convergentes : une résistance descendante + un support montant','Attendre la cassure de la ligne haute (continuation haussière) ou basse','Reporter la longueur du mât'],
      signaux:['Volume très faible pendant le fanion → signe de pause, pas de renversement','Volume explose à la cassure → signal fort','Fanion très court = signal plus puissant'],
      parametres:[{p:'Mât',d:'Forte impulsion initiale (haussière ou baissière)'},{p:'Fanion',d:'Triangle symétrique très court (moins d\'1 à 2 semaines)'},{p:'Volume',d:'Décroissant puis explosion'}],
      erreurs:['Confondre avec un triangle symétrique de long terme (qui n\'a pas de mât)','Fanion trop long → perd sa valeur de continuation'],
      pine:`// Fanion = mât + mini triangle symétrique + cassure`
    }
  }
];

const SMC = [
  {
    id:'structure', num:1, title:'Lire la Structure', tag:'LECTURE · BASE', kind:'neutral', schema:'structure',
    principe:['Haussier : sommets et creux de plus en plus hauts (HH / HL)','Baissier : sommets et creux de plus en plus bas (LH / LL)'],
    usage:'Donne le biais directionnel. On opère dans le sens de la structure tant qu\'elle n\'est pas cassée.',
    detail:{
      principe:'La structure de marché est le fondement du SMC. Avant toute entrée, il faut lire la séquence des pivots (swings). Une structure haussière est une série de Higher Highs (HH) et Higher Lows (HL). Tant que cette séquence est intacte, le biais est haussier.',
      formule:'Tendance haussière : HH et HL\nHH = Higher High  (sommet > sommet précédent)\nHL = Higher Low   (creux > creux précédent)\n\nTendance baissière : LH et LL\nLH = Lower High   (sommet < sommet précédent)\nLL = Lower Low    (creux < creux précédent)',
      calcul:['Identifier les pivots significatifs (swing highs et swing lows)','Comparer chaque pivot avec le précédent du même type','Série HH+HL = tendance haussière','Série LH+LL = tendance baissière','Mélange = structure en transition ou range'],
      signaux:['Structure haussière intacte → biais long uniquement','Structure baissière intacte → biais short uniquement','HL cassé → possible fin de tendance haussière (CHoCH)','LH cassé → possible fin de tendance baissière (CHoCH)'],
      parametres:[{p:'Timeframe HTF',d:'D1, H4 — donne le biais de fond (top-down)'},{p:'Timeframe LTF',d:'H1, M15 — exécution des entrées'},{p:'Pivot significatif',d:'Swing visible sur le timeframe analysé'}],
      erreurs:['Analyser uniquement le LTF sans le contexte HTF','Confondre chaque petite impulsion avec un pivot de structure','Opérer contre la structure de fond — les probabilités sont contre soi'],
      pine:`//@version=5
indicator("Structure SMC", overlay=true)
// Pivot Highs et Lows
ph = ta.pivothigh(high, 5, 5)
pl = ta.pivotlow(low, 5, 5)
plotshape(ph, "HH/LH", shape.triangledown, location.abovebar, color.red,   size=size.small)
plotshape(pl, "HL/LL", shape.triangleup,   location.belowbar, color.green, size=size.small)`
    }
  },
  {
    id:'bos', num:2, title:'BOS — Break of Structure', tag:'CONTINUATION', kind:'bull', schema:'bos',
    principe:['Clôture au-delà du dernier sommet (ou creux) majeur de la structure','Confirme que la tendance continue'],
    usage:'Valide la continuation. On cherche une entrée dans le sens du BOS sur le repli suivant.',
    detail:{
      principe:'Un Break of Structure (BOS) se produit quand le prix clôture au-delà du dernier pivot majeur dans le sens de la tendance existante. C\'est une confirmation que la structure reste intacte et que la tendance continue. Ce n\'est pas un signal d\'entrée direct — c\'est une validation.',
      formule:'BOS haussier : Close > Dernier HH (sommet majeur)\nBOS baissier : Close < Dernier LL (creux majeur)\n\nConfirmation : clôture franche, pas une simple mèche',
      calcul:['Identifier la structure en cours (haussière ou baissière)','Repérer le dernier pivot majeur (dernier HH en haussier)','Attendre que le prix clôture au-delà de ce pivot','Le BOS crée un nouveau niveau de référence (ex-sommet devient support potentiel)','Chercher un retour vers la zone du BOS pour entrer'],
      signaux:['BOS valide → continuer dans le sens de la tendance','Après un BOS, chercher un FVG ou OB laissé dans le mouvement','Le niveau du BOS devient une zone de support/résistance à surveiller','BOS sans pullback → attendre le retour (entrée plus sûre)'],
      parametres:[{p:'Timeframe',d:'Analyser sur HTF pour les BOS structurels'},{p:'Pivot majeur',d:'Swing high/low significatif, pas chaque micro-pivot'},{p:'Confirmation',d:'Clôture bougie, pas mèche seule'}],
      erreurs:['Entrer immédiatement après un BOS sans attendre le retour','Considérer chaque petit nouveau sommet comme un BOS structurel','Confondre BOS et CHoCH — le BOS confirme, le CHoCH retourne'],
      pine:`//@version=5
indicator("BOS / CHoCH", overlay=true)
ph = ta.pivothigh(high, 10, 10)
pl = ta.pivotlow(low, 10, 10)
// BOS détection simplifiée
bos_up = ta.crossover(close, ta.valuewhen(ph, high, 0))
bos_dn = ta.crossunder(close, ta.valuewhen(pl, low, 0))
bgcolor(bos_up ? color.new(color.green, 92) : bos_dn ? color.new(color.red, 92) : na)`
    }
  },
  {
    id:'choch', num:3, title:'CHoCH — Change of Character', tag:'RETOURNEMENT', kind:'bear', schema:'choch',
    principe:['Le dernier Higher Low est cassé en tendance haussière (ou LH en baissière)','Rupture du rythme des swings — signal de retournement potentiel'],
    usage:'Premier signal d\'un retournement possible. Souvent suivi d\'un BOS dans le nouveau sens.',
    detail:{
      principe:'Le Change of Character (CHoCH) est le premier signal que la tendance pourrait se retourner. En uptrend, un CHoCH se produit quand le dernier Higher Low (HL) est cassé — les vendeurs ont pris le contrôle suffisamment longtemps pour casser la séquence. Il précède souvent un BOS dans l\'autre sens.',
      formule:'CHoCH haussier → baissier : Close < Dernier HL\nCHoCH baissier → haussier : Close > Dernier LH\n\nLe CHoCH change le biais — attendre confirmation',
      calcul:['Identifier la structure en cours et son dernier pivot de confirmation (HL en uptrend)','Surveiller une cassure de ce pivot','Si le prix clôture sous le HL → CHoCH baissier','Le biais passe de haussier à neutre/baissier','Attendre le premier BOS dans la nouvelle direction pour confirmation'],
      signaux:['CHoCH = alerte, pas encore un signal d\'entrée systématique','Chercher le premier retour (retest du CHoCH) pour une entrée prudente','CHoCH + BOS dans le nouveau sens = confirmation de retournement','CHoCH en HTF = signal fort — structure majeure qui change'],
      parametres:[{p:'HTF',d:'CHoCH sur D1/H4 = signal fort'},{p:'LTF',d:'CHoCH sur M15 = signal faible (micro-structure)'},{p:'Confirmation',d:'BOS dans le nouveau sens pour valider'}],
      erreurs:['Trader le CHoCH immédiatement — il peut être suivi d\'une continuation (faux signal)','Confondre un simple repli (HL tenu) avec un CHoCH','Ignorer le contexte HTF : un CHoCH LTF contre une tendance HTF est dangereux'],
      pine:`// CHoCH = cassure du dernier HL (en uptrend) ou LH (en downtrend)
// Combiné avec le BOS dans le nouveau sens pour confirmation`
    }
  },
  {
    id:'liquidity', num:4, title:'Pools de Liquidité', tag:'LIQUIDITÉ', kind:'neutral', schema:'liquidity',
    principe:['Sommets/creux égaux (equal highs/lows) — stops accumulés au même niveau','BSL (Buy Side Liquidity) au-dessus des sommets, SSL (Sell Side) en dessous des creux'],
    usage:'Le prix est attiré par ces zones. Elles servent à la fois de cible et de piège avant le vrai mouvement.',
    detail:{
      principe:'La liquidité en SMC désigne les ordres stops des traders qui s\'accumulent au-dessus des sommets (stops des vendeurs à découvert → BSL) et en dessous des creux (stops des acheteurs → SSL). Les institutions ont besoin de cette liquidité pour remplir leurs gros ordres.',
      formule:'BSL (Buy Side Liquidity) = stops au-dessus des equal highs\nSSL (Sell Side Liquidity) = stops en dessous des equal lows\nEqual highs/lows = 2+ pivots au même niveau (±0.1-0.5%)',
      calcul:['Identifier des equal highs : 2+ sommets au même niveau (résistance testée plusieurs fois)','Identifier des equal lows : 2+ creux au même niveau (support testé plusieurs fois)','Ces niveaux concentrent des stops','Le prix sera attiré pour "prendre" cette liquidité avant le vrai mouvement'],
      signaux:['Equal highs = cible potentielle d\'un sweep haussier','Equal lows = cible potentielle d\'un sweep baissier','Plus il y a de touchées, plus il y a de liquidité accumulée','Après un sweep, le prix repart souvent fort dans la direction opposée'],
      parametres:[{p:'Equal highs/lows',d:'2 pivots à ±0.1-0.5% du même niveau'},{p:'Timeframe',d:'HTF = pools importants ; LTF = pools tactiques'},{p:'Nombre touchées',d:'3+ = pool très fourni, probable cible institutionnelle'}],
      erreurs:['Placer ses propres stops sur les equal highs/lows → se faire sweeper','Confondre un range normal avec des pools de liquidité','Penser que tout pool sera swipé — certains restent intacts longtemps'],
      pine:`//@version=5
indicator("Equal H/L", overlay=true)
// Détecter equal highs
ph = ta.pivothigh(high, 5, 5)
ph_prev = ta.valuewhen(ph, high, 1)
eq_high = ph and math.abs(high - ph_prev) / ph_prev < 0.002
plotshape(eq_high, "EQH", shape.diamond, location.abovebar, color.red)`
    }
  },
  {
    id:'sweep', num:5, title:'Sweep / Liquidity Grab', tag:'PIÈGE', kind:'bear', schema:'sweep',
    principe:['Mèche qui dépasse brièvement un niveau évident (pool de liquidité)','Rejet immédiat et retour dans le range après avoir pris les stops'],
    usage:'Les stops sont pris, puis le prix repart à l\'inverse. Souvent le déclencheur du vrai mouvement.',
    detail:{
      principe:'Le sweep (ou liquidity grab) se produit quand le prix dépasse brièvement un niveau clé, activant les stops, puis revient immédiatement. C\'est une manipulation institutionnelle : les institutions "achètent" les stops des vendeurs ou "vendent" les stops des acheteurs pour se remplir à un meilleur prix.',
      formule:'Sweep haussier : prix dépasse equal highs puis rejette fortement\nSweep baissier : prix dépasse equal lows puis rejette fortement\n\nSignal = mèche + clôture de retour sous/sur le niveau swipé',
      calcul:['Identifier un pool de liquidité (equal highs ou lows)','Attendre que le prix approche et le dépasse brièvement','Observer un rejet : mèche longue, clôture de retour dans le range','Le sweep est confirmé par une bougie de rejet forte','Chercher un point d\'entrée après confirmation (CHoCH + structure LTF)'],
      signaux:['Mèche longue + clôture inverse → sweep probable','Plus la mèche est longue et le corps de rejet fort → signal plus puissant','Sweep d\'un HTF BSL suivi d\'un CHoCH → setup court terme','Volume élevé sur la mèche → confirmation institutionnelle'],
      parametres:[{p:'Timeframe',d:'H4/D1 pour les sweeps majeurs ; M15/H1 pour l\'exécution'},{p:'Niveau swipé',d:'Equal highs/lows, résistances majeures, pivots H/D'},{p:'Rejet',d:'Corps de bougie doit clôturer SOUS/SUR le niveau swipé'}],
      erreurs:['Entrer pendant la mèche (dans le sens du sweep) — très risqué','Confondre une vraie cassure avec un sweep — attendre la clôture de retour','Trader tous les sweeps sans confirmer avec la structure'],
      pine:`// Sweep : mèche au-delà d'un niveau + clôture de retour
// Identifier visuellement ou avec des alertes sur les niveaux clés`
    }
  },
  {
    id:'inducement', num:6, title:'Inducement (IDM)', tag:'LEURRE', kind:'neutral', schema:'inducement',
    principe:['Petit swing évident placé avant la vraie zone (OB)','Sert d\'appât aux traders pressés qui entrent trop tôt'],
    usage:'Le marché prend cette liquidité avant de respecter l\'order block. À laisser se faire avant d\'entrer.',
    detail:{
      principe:'L\'Inducement (IDM) est un faux signal ou un leurre. C\'est un swing évident (high ou low) placé juste avant la vraie zone institutionnelle (order block ou FVG). Les traders retail entrent sur ce swing, leurs stops sont pris (sweep de l\'IDM), puis le prix repart de la vraie zone.',
      formule:'IDM = pivot évident avant l\'OB/FVG\nStructure : IDM → Sweep IDM → Mitigation OB → Move fort\n\nL\'IDM "nettoie" la liquidité avant que le vrai mouvement parte de l\'OB',
      calcul:['Identifier un order block ou FVG potentiel','Repérer le swing évident (IDM) entre le prix actuel et l\'OB','Attendre le sweep de l\'IDM (prix dépasse et revient)','Chercher une entrée sur l\'OB/FVG APRÈS que l\'IDM ait été swipé','Stop sous/sur l\'OB, cible = prochain pool de liquidité'],
      signaux:['IDM swipé + retour dans la zone → chercher l\'entrée','IDM swipé + CHoCH LTF → confirmation supplémentaire','IDM non swipé → ne pas entrer sur l\'OB, risque de retournement encore'],
      parametres:[{p:'Position IDM',d:'Entre le prix actuel et la zone d\'entrée visée'},{p:'Type IDM',d:'Swing high ou low évident, facile à identifier'},{p:'Confirmation',d:'Sweep de l\'IDM + respect de l\'OB ensuite'}],
      erreurs:['Entrer sur l\'OB AVANT que l\'IDM soit swipé — risque élevé','Ignorer l\'IDM et se faire piéger dans le sens du faux signal'],
      pine:`// IDM : identifier manuellement le swing avant la zone d'entrée
// Ne pas entrer avant que ce swing soit swipé`
    }
  },
  {
    id:'ob_bull', num:7, title:'Order Block Haussier', tag:'ZONE · ACHAT', kind:'bull', schema:'ob_bull',
    principe:['Dernière bougie baissière AVANT une forte impulsion haussière qui casse la structure','Zone où les institutions ont placé leurs ordres d\'achat'],
    usage:'Zone d\'achat : attendre le retour du prix dans le bloc (mitigation) pour entrer long.',
    detail:{
      principe:'L\'Order Block (OB) haussier est la zone de prix correspondant à la dernière bougie baissière avant une forte impulsion haussière. C\'est là que les institutions ont acheté massivement. Lors du retour sur cette zone, leurs ordres résiduels défendent le niveau.',
      formule:'OB haussier = corps de la dernière bougie baissière avant l\'impulsion\nZone OB = [Open de la bougie baissière, Close de la bougie baissière]\n\nL\'impulsion doit : casser la structure ET créer un FVG ou BOS',
      calcul:['Identifier une forte impulsion haussière qui casse la structure (BOS)','Reculer d\'une bougie : la dernière bougie baissière = OB','Tracer un rectangle sur le corps de cette bougie (open à close)','Attendre que le prix revienne dans ce rectangle (mitigation)','Entrer long dans la zone, stop sous le bas de l\'OB'],
      signaux:['Retour sur OB + bougie de rejet haussière → entrée','Retour sur OB + CHoCH sur LTF → entrée avec confirmation','OB non mitié = potentiel intact','OB partiellement mitié = reste valide'],
      parametres:[{p:'Qualité OB',d:'L\'impulsion suivante doit être forte (displacement) et casser la structure'},{p:'Mitigation',d:'Retour sur le corps de la bougie (50-100% du corps)'},{p:'Stop',d:'Sous le bas de l\'OB (incluant la mèche basse)'}],
      erreurs:['Prendre la mauvaise bougie (pas la dernière avant l\'impulsion)','Entrer sans que le prix ne soit revenu dans la zone','OB invalidé si le prix clôture SOUS le bas de l\'OB'],
      pine:`// OB haussier : dernière bougie baissière avant impulsion haussière
// Identifier manuellement — tracer rectangle sur son corps`
    }
  },
  {
    id:'ob_bear', num:8, title:'Order Block Baissier', tag:'ZONE · VENTE', kind:'bear', schema:'ob_bear',
    principe:['Dernière bougie haussière AVANT une forte impulsion baissière qui casse la structure','Zone où les institutions ont vendu massivement'],
    usage:'Zone de vente : attendre le retour du prix dans le bloc pour entrer short.',
    detail:{
      principe:'L\'Order Block baissier est la dernière bougie haussière avant une forte impulsion baissière. Les institutions y ont vendu massivement. Lors du retour sur cette zone, leurs ordres résiduels créent une résistance.',
      formule:'OB baissier = corps de la dernière bougie haussière avant l\'impulsion\nZone OB = [Close, Open] de la bougie haussière\n\nL\'impulsion doit casser la structure (CHoCH ou BOS baissier)',
      calcul:['Identifier une forte impulsion baissière qui casse la structure','Reculer d\'une bougie : la dernière bougie haussière = OB','Tracer le rectangle sur son corps','Attendre le retour dans la zone','Entrer short dans l\'OB, stop au-dessus du haut de l\'OB'],
      signaux:['Retour sur OB + bougie de rejet baissière → entrée short','Volume faible sur le retour + fort sur l\'impulsion → confirmation','OB mitigé mais prix clôture AU-DESSUS → OB invalidé'],
      parametres:[{p:'Qualité OB',d:'Impulsion baissière forte, BOS/CHoCH baissier'},{p:'Mitigation',d:'Retour dans le corps de la bougie'},{p:'Stop',d:'Au-dessus du haut de l\'OB (mèche incluse)'}],
      erreurs:['Entrer avant la mitigation','Confondre OB et zone de consolidation (pas d\'impulsion claire)'],
      pine:`// OB baissier : dernière bougie haussière avant impulsion baissière`
    }
  },
  {
    id:'breaker', num:9, title:'Breaker Block', tag:'FLIP', kind:'neutral', schema:'breaker',
    principe:['Un order block qui a failli : le prix l\'a traversé dans le mauvais sens','Le bloc cassé est retesté depuis l\'autre côté — il a "flippé"'],
    usage:'L\'ancien support devient résistance (et inversement). Point d\'entrée après le flip.',
    detail:{
      principe:'Le Breaker Block est un OB qui a été invalidé — le prix l\'a traversé en clôture. Mais au lieu d\'être abandonné, ce bloc devient une zone d\'entrée dans le sens opposé. C\'est le concept de "support devenu résistance" version SMC.',
      formule:'OB haussier traversé par le prix → Breaker baissier\nOB baissier traversé par le prix → Breaker haussier\n\nLe retest du Breaker = zone d\'entrée dans le nouveau sens',
      calcul:['Identifier un OB (haussier ou baissier)','Observer si le prix traverse cet OB en clôture (invalidation)','L\'OB invalidé devient un Breaker Block','Attendre que le prix revienne retest ce niveau depuis l\'autre côté','Entrer dans le sens du nouveau mouvement au retest'],
      signaux:['Breaker retesté + rejet → entrée','Plus l\'OB original était "propre", plus le Breaker est fiable','Breaker en confluence avec un FVG ou un niveau de structure → signal fort'],
      parametres:[{p:'Invalidation',d:'Clôture au-delà de l\'OB (pas seulement une mèche)'},{p:'Retest',d:'Retour sur la zone du Breaker depuis l\'autre côté'},{p:'Confirmation',d:'Bougie de rejet au retest'}],
      erreurs:['Confondre invalidation (clôture) avec simple mèche','Trader le Breaker sans attendre le retest'],
      pine:`// Breaker : OB invalidé qui devient zone d'entrée inverse`
    }
  },
  {
    id:'mitigation', num:10, title:'Mitigation Block', tag:'RETOUR', kind:'bull', schema:'mitigation',
    principe:['Zone d\'origine d\'un mouvement où des ordres institutionnels sont restés non remplis','Le prix y revient pour "mitiger" (remplir) ces ordres'],
    usage:'Point de ré-entrée dans le sens de la tendance après un retour sur la zone.',
    detail:{
      principe:'La mitigation désigne le retour du prix sur une zone d\'où il est parti fortement, pour y combler les ordres institutionnels non remplis lors du premier passage. C\'est similaire à l\'OB mais l\'accent est mis sur le fait que des ordres RÉSIDUELS attendent encore dans cette zone.',
      formule:'Zone de mitigation = zone d\'origine d\'un mouvement fort\nMitigation = retour du prix dans cette zone pour y "absorber" les ordres restants',
      calcul:['Identifier un mouvement fort qui a créé un BOS ou CHoCH','Repérer la zone de départ de ce mouvement','Attendre le retour du prix dans cette zone','Chercher des signaux LTF (CHoCH, OB, FVG) pour entrer','Stop sous la zone de mitigation, cible = prochain pool de liquidité'],
      signaux:['Retour sur la zone + absorption visible (bougies courtes, volume décroissant) → zone respectée','Rejet fort de la zone → entrée dans le sens original','Mitigation profonde (>50%) mais sans clôture dessous → toujours valide'],
      parametres:[{p:'Profondeur',d:'Mitigation à 50-100% de la zone'},{p:'Timeframe',d:'Analyser en HTF, exécuter en LTF'},{p:'Confirmation',d:'CHoCH sur LTF ou bougie de rejet claire'}],
      erreurs:['Confondre mitigation et invalidation (clôture complète sous/sur la zone)','Entrer sans confirmation LTF sur la zone'],
      pine:`// Mitigation Block : zone de départ d'un mouvement fort`
    }
  },
  {
    id:'fvg', num:11, title:'Fair Value Gap (FVG)', tag:'DÉSÉQUILIBRE', kind:'neutral', schema:'fvg',
    principe:['3 bougies : grande bougie centrale laissant un vide entre mèche de la 1re et mèche de la 3e','Déséquilibre non comblé qui tend à attirer le prix'],
    usage:'Zone d\'entrée fréquente lors du retour. Le prix tend à combler le FVG avant de continuer.',
    detail:{
      principe:'Un Fair Value Gap (FVG) ou Imbalance est un déséquilibre entre acheteurs et vendeurs créé par un mouvement rapide. Les 3 bougies laissent un vide entre la mèche haute de la 1re bougie et la mèche basse de la 3e (FVG haussier) ou l\'inverse (FVG baissier). Le prix tend à y retourner pour "rééquilibrer".',
      formule:'FVG haussier : Low(bougie 3) > High(bougie 1) → vide entre ces deux niveaux\nFVG baissier : High(bougie 3) < Low(bougie 1) → vide entre ces deux niveaux\n\nZone FVG = [High(bougie 1), Low(bougie 3)] pour FVG haussier',
      calcul:['Regarder 3 bougies consécutives','FVG haussier : si Low(C3) > High(C1) → il y a un vide entre High(C1) et Low(C3)','FVG baissier : si High(C3) < Low(C1) → vide entre Low(C1) et High(C3)','Ce vide est la zone FVG','Le prix tend à y revenir (mitigation du FVG) avant de continuer'],
      signaux:['FVG dans le sens de la tendance = zone d\'entrée','Retour sur FVG + rejet → entrée','FVG entièrement comblé → zone invalidée','FVG partiellement comblé (50%) → zone encore valide','FVG dans un OB = confluence forte'],
      parametres:[{p:'Taille',d:'Plus grand = plus significatif (mouvement plus impulsif)'},{p:'Timeframe',d:'FVG HTF = zones importantes ; LTF = exécution'},{p:'Mitigation',d:'50% à 100% du FVG comblé'}],
      erreurs:['Trader tous les FVG indépendamment de la tendance','FVG entièrement comblé avec clôture dedans = invalidé','Ignorer la direction — un FVG baissier en uptrend n\'est qu\'un support'],
      pine:`//@version=5
indicator("FVG", overlay=true)
// FVG haussier : low[0] > high[2]
fvg_bull = low > high[2]
fvg_bear = high < low[2]
bgcolor(fvg_bull ? color.new(color.green, 88) : fvg_bear ? color.new(color.red, 88) : na)`
    }
  },
  {
    id:'displacement', num:12, title:'Displacement', tag:'IMPULSION', kind:'bull', schema:'displacement',
    principe:['Mouvement violent à grandes bougies dans un sens, souvent avec gaps','Casse la structure et crée des FVG — signe d\'intention institutionnelle forte'],
    usage:'Valide la direction et les zones d\'entrée laissées derrière (FVG, OB).',
    detail:{
      principe:'Le Displacement est un mouvement impulsif fort, caractérisé par des grandes bougies dans un sens, généralement avec peu de mèches (décision claire). Il signale qu\'une institution a placé un gros ordre. Il crée des FVG et des OB utilisables pour les entrées sur retour.',
      formule:'Displacement = mouvement fort + BOS + création de FVG\n\nCritères : grandes bougies, peu de mèches, souvent > 1-2% en quelques bougies',
      calcul:['Observer un mouvement de plusieurs grandes bougies dans le même sens','Vérifier qu\'il casse la structure (BOS ou CHoCH)','Identifier les FVG créés dans le mouvement','Attendre un retour sur le FVG ou l\'OB le plus proche','Entrer dans le sens du Displacement'],
      signaux:['Displacement fort = intention claire → biais dans ce sens','Retour sur le FVG du Displacement = zone d\'entrée premium','Plus le Displacement est impulsif et propre, plus les zones sont fiables','Displacement contre une tendance HTF → signal plus faible'],
      parametres:[{p:'Force',d:'3+ grandes bougies dans le même sens, peu de mèches'},{p:'Cassure',d:'Doit créer un BOS pour être valide en SMC'},{p:'FVG',d:'Identifier les imbalances créées pour les cibler comme entrées'}],
      erreurs:['Confondre Displacement et simple mouvement fort qui ne casse pas la structure','Entrer dans le Displacement (chasing) → entrer sur le retour est bien plus sûr'],
      pine:`// Displacement : mouvement fort + BOS + création FVG
// Identifier visuellement sur le graphique`
    }
  },
  {
    id:'void_', num:13, title:'Liquidity Void', tag:'VIDE', kind:'neutral', schema:'void_',
    principe:['Large zone parcourue très vite, presque sans mèches ni consolidation','Survient souvent après un Displacement — le prix n\'a pas "échangé" dans cette zone'],
    usage:'Le prix revient souvent rééquilibrer ce vide avant de continuer sa route.',
    detail:{
      principe:'Le Liquidity Void (vide de liquidité) est une zone de prix traversée si rapidement qu\'il y a eu très peu d\'échanges. Contrairement au FVG (entre 3 bougies), le void peut s\'étendre sur plusieurs bougies. Le prix tend à y revenir pour combler ce vide d\'échanges.',
      formule:'Void = zone parcourue très rapidement avec des bougies au corps long et peu de mèches\nZone void = du bas au haut de la zone traversée rapidement',
      calcul:['Identifier une zone traversée très vite (plusieurs bougies de même couleur, corps longs)','Cette zone n\'a eu que peu d\'échanges → vide de liquidité','Tracer la zone du void (de la première à la dernière bougie de l\'impulsion)','Attendre un retour dans cette zone pour les entrées de rééquilibrage'],
      signaux:['Prix entre dans le void → zone de turbulence probable','Objectif : combler 50-100% du void avant de reprendre','Void + FVG dans la même zone → confluence forte','Après rééquilibrage du void → reprise de la tendance'],
      parametres:[{p:'Taille',d:'Plus grand = plus significatif'},{p:'Vitesse',d:'Traversé rapidement = signal de void'},{p:'Rééquilibrage',d:'50% ou plus du void comblé = rééquilibrage partiel'}],
      erreurs:['Confondre void et consolidation normale','Penser que le void DOIT être comblé — parfois le prix ne revient pas'],
      pine:`// Liquidity Void : zone traversée rapidement sans consolidation`
    }
  },
  {
    id:'premium', num:14, title:'Premium / Discount', tag:'ÉQUILIBRE', kind:'neutral', schema:'premium',
    principe:['Fib 50% du dernier range = équilibre du marché','Au-dessus du 50% = Premium (cher) → vente ; En dessous = Discount (pas cher) → achat'],
    usage:'Acheter en Discount, vendre en Premium. Entrée optimale (OTE) entre 61.8% et 78.6%.',
    detail:{
      principe:'Le concept Premium/Discount divise le range entre un swing low et un swing high par leur milieu (50%). Au-dessus du 50%, le prix est "cher" (premium) — zone de vente. En dessous, il est "bon marché" (discount) — zone d\'achat. On cherche à acheter en discount et vendre en premium.',
      formule:'Range = Swing High − Swing Low\n50% = (Swing High + Swing Low) / 2\nDiscount = prix < 50% du range\nPremium   = prix > 50% du range\nOTE (Optimal Trade Entry) = zone 61.8% − 78.6% (retracement Fibonacci)',
      calcul:['Identifier le dernier swing high et swing low significatifs','Placer un Fibonacci de 0 à 1 sur ce range','0% = Swing Low, 100% = Swing High (ou inverse selon le sens)','Zone discount = 50%-100% en bas (retracement > 50%)','OTE = 61.8% à 78.6% de retracement = entrée optimale institutionnelle'],
      signaux:['Acheter uniquement en discount avec confirmation (OB, FVG)','Vendre uniquement en premium avec confirmation','OTE (61.8-78.6%) + OB/FVG + sweep = setup d\'entrée idéal','Éviter les entrées à l\'équilibre (50%)'],
      parametres:[{p:'Range',d:'Du dernier swing significatif (HTF pour les setups majeurs)'},{p:'OTE',d:'61.8% à 78.6% de retracement — zone institutionnelle préférée'},{p:'Confirmation',d:'Toujours associer à OB, FVG ou structure'}],
      erreurs:['Acheter en premium ou vendre en discount → contre le biais statistique','Oublier le contexte de tendance HTF — en downtrend, le discount peut continuer à baisser','Utiliser sans confirmation de zone (OB/FVG)'],
      pine:`//@version=5
indicator("Premium/Discount", overlay=true)
// Fibonacci manuel dans TradingView
// Ou avec les niveaux auto-Fibonacci
var float hi = na; var float lo = na
if ta.pivothigh(high, 10, 10) hi := high
if ta.pivotlow(low, 10, 10)  lo := low
mid = (hi + lo) / 2
plot(mid, "50% Équilibre", color.gray, 1, plot.style_line)`
    }
  },
  {
    id:'model', num:15, title:'Le Modèle Complet SMC', tag:'SYNTHÈSE', kind:'bull', schema:'model',
    principe:['Sweep de liquidité → CHoCH → retour en FVG/OB côté discount','Entrée sur la zone, stop sous le sweep, cible = liquidité opposée'],
    usage:'Cible = la liquidité opposée (BSL ou SSL). C\'est le schéma d\'exécution classique en SMC.',
    detail:{
      principe:'Le modèle d\'exécution SMC complet combine tous les concepts en une séquence logique. Il décrit comment les institutions : 1) chassent les liquidités, 2) retournent la structure, 3) reviennent dans une zone institutionnelle pour exécuter leurs ordres, avant de partir vers la liquidité opposée.',
      formule:'Séquence type :\n1. Sweep SSL (chasse les stops acheteurs) ou BSL\n2. CHoCH → changement de structure\n3. BOS dans le nouveau sens\n4. Retour en FVG ou OB en discount\n5. Entrée → Stop sous le sweep → Cible = BSL opposé',
      calcul:['Top-down : lire la tendance HTF (D1, H4)','Identifier les pools de liquidité (BSL/SSL) sur le HTF','Descendre sur M15/H1 : attendre le sweep d\'un pool','Observer le CHoCH après le sweep','Chercher le premier OB ou FVG dans le sens du nouveau mouvement','Entrer sur le retour dans la zone, stop sous le sweep, cible = pool opposé'],
      signaux:['Toute la séquence alignée = setup de haute probabilité','Confirmation LTF obligatoire (CHoCH sur M5/M15)','R/R minimum 1:2, idéalement 1:3 ou plus','Volume institutionnel sur le displacement → confirmation'],
      parametres:[{p:'HTF',d:'D1/H4 — lecture de la tendance et identification des pools'},{p:'MTF',d:'H1 — vue d\'ensemble du setup'},{p:'LTF',d:'M15/M5 — confirmation et entrée précise'},{p:'Stop',d:'Sous le low du sweep (en haussier)'},{p:'Cible',d:'Pool de liquidité opposé (BSL en haussier, SSL en baissier)'}],
      erreurs:['Entrer sans le CHoCH → risque de continuer dans l\'ancien sens','Cibler trop loin sans liquidité intermédiaire','Ignorer le contexte HTF → trader contre la tendance de fond','R/R < 1:2 → l\'espérance mathématique n\'est pas assez favorable'],
      pine:`// Modèle SMC complet — checklist d'exécution :
// ✓ HTF : tendance + pool de liquidité identifié
// ✓ Sweep du pool (mèche + clôture de retour)
// ✓ CHoCH sur MTF/LTF
// ✓ FVG ou OB en discount identifié
// ✓ Retour sur la zone + confirmation LTF
// ✓ Stop sous le sweep / Target = pool opposé
// → Entrée uniquement si TOUS les critères cochés`
    }
  }
];
