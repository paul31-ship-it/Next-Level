// api/contact.js — Vercel Serverless Function (CommonJS)
// Enregistre un lead dans la DB Notion "📥 Leads — Demandes de contact"

const NOTION_API     = 'https://api.notion.com/v1/pages';
const NOTION_VERSION = '2022-06-28';
const EMAIL_RE       = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TYPE_LABELS = {
  'coach-benevole' : 'Coach bénévole',
  'coach-pro'      : 'Coach professionnel',
  'president-club' : 'Président de club',
  'parent'         : 'Parent / Joueur',
  'partenaire'     : 'Partenaire / Investisseur',
  'media'          : 'Journaliste / Média',
  'beta'           : 'Rejoindre la bêta',
  'demo'           : 'Voir une démo',
  'club'           : 'Déployer dans mon club',
  'partenariat'    : 'Partenariat',
  'presse'         : 'Demande presse',
  'support'        : 'Support technique',
  'autre'          : 'Autre',
};

module.exports = async function handler(req, res) {
  // CORS — lecture seule des origines autorisées
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const origin = req.headers.origin || '';
  const allowed =
    origin === 'https://nextlevel.paulfourny.com' ||
    /^https:\/\/next-level[a-z0-9-]*\.vercel\.app$/.test(origin) ||
    origin === 'http://localhost:3456';

  res.setHeader(
    'Access-Control-Allow-Origin',
    allowed ? origin : 'https://nextlevel.paulfourny.com'
  );

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  const {
    prenom   = '',
    nom      = '',
    email    = '',
    club     = '',
    sujet    = '',
    objet    = '',
    message  = '',
    website  = '',       // honeypot — doit rester vide
  } = req.body || {};

  // Honeypot : un bot a rempli le champ caché → on simule un succès sans rien écrire
  if (website) return res.status(200).json({ success: true });

  // Validation minimale côté serveur
  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Adresse email invalide.' });
  }
  if (!message || message.trim().length < 5) {
    return res.status(400).json({ error: 'Message trop court.' });
  }

  const fullName  = [prenom, nom].filter(Boolean).join(' ').trim() || 'Anonyme';
  const typeLabel = TYPE_LABELS[objet] || TYPE_LABELS[sujet] || objet || sujet || 'Non précisé';
  const today     = new Date().toISOString().split('T')[0];

  const body = {
    parent: { database_id: process.env.NOTION_DB_ID || '33b598e148ba4645b0e34a27426d456e' },
    properties: {
      'Nom'               : { title     : [{ text: { content: fullName } }] },
      'Email'             : { email     : email },
      'Entreprise'        : { rich_text : [{ text: { content: club.slice(0, 200) } }] },
      'Message'           : { rich_text : [{ text: { content: message.slice(0, 2000) } }] },
      'Type de besoin'    : { select    : { name: typeLabel } },
      'Date de réception' : { date      : { start: today } },
      'État du prospect'  : { select    : { name: '🆕 Nouveau' } },
      'Source'            : { select    : { name: 'Formulaire site' } },
    },
  };

  try {
    const r = await fetch(NOTION_API, {
      method  : 'POST',
      headers : {
        'Authorization'  : `Bearer ${process.env.NOTION_API_KEY}`,
        'Content-Type'   : 'application/json',
        'Notion-Version' : NOTION_VERSION,
      },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      // Ne pas exposer le détail Notion au client
      console.error('[contact] Notion error', r.status, await r.text());
      return res.status(502).json({ error: 'Impossible d\'envoyer le message pour l\'instant. Réessaie dans quelques instants.' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[contact] fetch error:', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
};
