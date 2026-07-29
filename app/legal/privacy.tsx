import { LegalDocument, type LegalSection } from '@/components/ui/LegalDocument';
import { legal } from '@/constants/legal';

const INTRO =
  'CoffeeMap t’aide à trouver des cafés autour de toi. Cette politique explique quelles données ' +
  'sont traitées, pourquoi, et comment tu gardes la main dessus. En résumé : aucune publicité, ' +
  'aucun traceur, aucune revente de données, et tu peux tout supprimer depuis l’app.';

const SECTIONS: LegalSection[] = [
  {
    heading: '1. Qui est responsable de tes données',
    paragraphs: [
      `L’application CoffeeMap est éditée par ${legal.editor}, ${legal.editorAddress}. ` +
        `Pour toute question ou demande relative à tes données, tu peux écrire à ${legal.contactEmail}.`,
    ],
  },
  {
    heading: '2. Utiliser l’app sans compte',
    paragraphs: [
      'La création d’un compte est facultative. Sans compte, tu peux consulter la carte, chercher ' +
        'des cafés, enregistrer des favoris, marquer des cafés visités et créer des recettes : ces ' +
        'informations restent alors stockées uniquement sur ton téléphone et ne sont transmises à ' +
        'aucun serveur.',
      'Si tu crées un compte par la suite, les éléments enregistrés sur l’appareil sont transférés ' +
        'une seule fois vers ton compte afin d’être synchronisés.',
    ],
  },
  {
    heading: '3. Données traitées',
    paragraphs: [
      'Compte : ton adresse email et le nom que tu renseignes à l’inscription. Si tu passes par ' +
        '« Continuer avec Apple » ou « Continuer avec Google », ces fournisseurs nous transmettent ' +
        'ton adresse email et, le cas échéant, ton nom.',
      'Position : avec ton autorisation, l’app lit ta position pendant que tu l’utilises pour ' +
        'afficher les cafés proches. Tes coordonnées sont envoyées au service de recherche de lieux ' +
        'pour obtenir les résultats, mais ne sont ni enregistrées dans nos bases, ni associées à ton ' +
        'compte, ni conservées après la recherche. Tu peux refuser l’accès à la position : l’app ' +
        'reste utilisable et affiche alors une zone par défaut.',
      'Contenus que tu enregistres : tes cafés favoris, tes cafés visités et tes recettes, avec la ' +
        'date d’enregistrement. Pour les cafés, cela inclut les informations publiques du lieu (nom, ' +
        'adresse, note, photos) afin de pouvoir te les réafficher.',
      'L’app ne collecte aucune donnée d’analyse d’audience, aucun identifiant publicitaire, et ne ' +
        'suit pas ton activité dans d’autres applications ou sites.',
    ],
  },
  {
    heading: '4. Pourquoi ces données sont traitées',
    paragraphs: [
      'Fournir le service que tu demandes : afficher les cafés proches, mémoriser tes favoris, tes ' +
        'visites et tes recettes, et te permettre de les retrouver sur tes appareils (exécution du ' +
        'contrat, article 6.1.b du RGPD).',
      'Accéder à ta position repose sur ton consentement, que tu peux retirer à tout moment dans les ' +
        'réglages de ton téléphone (article 6.1.a du RGPD).',
    ],
  },
  {
    heading: '5. Qui d’autre intervient',
    paragraphs: [
      `Hébergement et comptes : ${legal.host} héberge la base de données et gère l’authentification. ` +
        `Région d’hébergement : ${legal.hostRegion}.`,
      'Recherche de lieux : Google (API Google Places) fournit la liste des cafés, leurs fiches et ' +
        'leurs photos. Ce service reçoit les coordonnées de la zone recherchée.',
      'Cartographie : la carte est affichée par le service de cartographie du système (Apple Plans ' +
        'sur iOS, Google Maps sur Android).',
      'Connexion tierce : si tu utilises Apple ou Google pour te connecter, l’échange est soumis à ' +
        'la politique de confidentialité du fournisseur concerné.',
      'Aucune de tes données n’est vendue, louée ou transmise à des fins publicitaires.',
    ],
  },
  {
    heading: '6. Durée de conservation',
    paragraphs: [
      'Les données liées à ton compte sont conservées tant que le compte existe. Lorsque tu supprimes ' +
        'ton compte, le compte et l’ensemble des contenus associés (favoris, cafés visités, recettes) ' +
        'sont effacés immédiatement et définitivement.',
      'Les données enregistrées sans compte restent sur ton téléphone jusqu’à ce que tu les supprimes ' +
        'ou que tu désinstalles l’application.',
    ],
  },
  {
    heading: '7. Tes droits',
    paragraphs: [
      'Tu disposes d’un droit d’accès, de rectification, d’effacement, de limitation, d’opposition et ' +
        'de portabilité sur tes données.',
      'Le droit d’effacement s’exerce directement dans l’app : Profil → Paramètres → Supprimer mon ' +
        'compte. Pour les autres demandes, écris à ' + legal.contactEmail + '.',
      'Si tu estimes que tes droits ne sont pas respectés, tu peux introduire une réclamation auprès ' +
        'de la CNIL (www.cnil.fr).',
    ],
  },
  {
    heading: '8. Sécurité',
    paragraphs: [
      'Les échanges avec nos serveurs sont chiffrés (HTTPS). L’accès à tes contenus est restreint au ' +
        'niveau de la base de données : techniquement, seule ta propre session peut lire ou modifier ' +
        'tes favoris, tes cafés visités et tes recettes.',
    ],
  },
  {
    heading: '9. Mineurs',
    paragraphs: [
      'L’application n’est pas destinée aux enfants de moins de 15 ans. Si tu as moins de 15 ans, ' +
        'l’accord de tes parents ou tuteurs est nécessaire pour créer un compte.',
    ],
  },
  {
    heading: '10. Modifications',
    paragraphs: [
      'Cette politique peut évoluer, notamment si de nouvelles fonctionnalités sont ajoutées. En cas ' +
        'de changement important, tu en seras informé dans l’application. La date de dernière mise à ' +
        'jour figure en haut de ce document.',
    ],
  },
];

export default function PrivacyScreen() {
  return (
    <LegalDocument
      title="Confidentialité"
      intro={INTRO}
      sections={SECTIONS}
    />
  );
}
