// api/contact.js — Vercel Serverless Function
// Enregistre un lead dans la base Notion "📥 Leads — Demandes de contact"

const NOTION_API = 'https://api.notion.com/v1/pages';
const NOTION_VERSION = '2022-06-28';

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

export default async function handler(req, res) {
  // CORS pour les requêtes cross-origin (preview Vercel, etc.)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    prenom = '',
    nom    = '',
    email  = '',
    club   = '',
    sujet  = '',
    objet  = '',
    message = '',
  } = req.body || {};

  // Validation minimale
  if (!email || !message) {
    return res.status(400).json({ error: 'Champs obligatoires manquants (email, message).' });
  }

  const fullName  = [prenom, nom].filter(Boolean).join(' ').trim() || 'Anonyme';
  const typeLabel = TYPE_LABELS[objet] || TYPE_LABELS[sujet] || objet || sujet || 'Non précisé';
  const today     = new Date().toISOString().split('T')[0];

  const body = {
    parent: { database_id: process.env.NOTION_DB_ID || '33b598e148ba4645b0e34a27426d456e' },
    properties: {
      'Nom': {
        title: [{ text: { content: fullName } }],
      },
      'Email': {
        email: email,
      },
      'Entreprise': {
        rich_text: [{ text: { content: club } }],
      },
      'Message': {
        rich_text: [{ text: { content: message.slice(0, 2000) } }],
      },
      'Type de besoin': {
        select: { name: typeLabel },
      },
      'Date de réception': {
        date: { start: today },
      },
      'État du prospect': {
        select: { name: '🆕 Nouveau' },
      },
      'Source': {
        select: { name: 'Formulaire site' },
      },
    },
  };

  try {
    const r = await fetch(NOTION_API, {
      method: 'POST',
      headers: {
        'Authorization'  : `Bearer ${process.env.NOTION_API_KEY}`,
        'Content-Type'   : 'application/json',
        'Notion-Version' : NOTION_VERSION,
      },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const detail = await r.text();
      console.error('[contact] Notion error:', detail);
      return res.status(502).json({ error: 'Erreur Notion', detail });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[contact] fetch error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
