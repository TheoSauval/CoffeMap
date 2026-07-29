import { LegalDocument, type LegalSection } from '@/components/ui/LegalDocument';
import { legal } from '@/constants/legal';

const INTRO =
  'Ces conditions encadrent l’utilisation de l’application CoffeeMap. En l’utilisant, tu acceptes ' +
  'les règles ci-dessous. Prends le temps de les lire : elles précisent ce que le service fait, ce ' +
  'qu’il ne garantit pas, et ce qu’on attend de toi.';

const SECTIONS: LegalSection[] = [
  {
    heading: '1. Éditeur',
    paragraphs: [
      `L’application CoffeeMap est éditée par ${legal.editor}, ${legal.editorAddress}. ` +
        `Contact : ${legal.contactEmail}. Hébergement des données : ${legal.host}`,
    ],
  },
  {
    heading: '2. Objet du service',
    paragraphs: [
      'CoffeeMap permet de découvrir des cafés à proximité, de consulter leurs informations ' +
        'pratiques, d’enregistrer des favoris, de tenir la liste des cafés visités et de conserver ' +
        'des recettes de café.',
      'Le service est fourni gratuitement. Certaines fonctionnalités nécessitent une connexion ' +
        'internet et, pour la recherche par proximité, l’accès à la position de l’appareil.',
    ],
  },
  {
    heading: '3. Compte',
    paragraphs: [
      'L’utilisation de l’app ne requiert pas de compte. Créer un compte permet de synchroniser tes ' +
        'contenus entre plusieurs appareils.',
      'Tu es responsable de la confidentialité de tes identifiants et des actions effectuées depuis ' +
        'ton compte. Les informations que tu fournis à l’inscription doivent être exactes.',
      'Tu peux supprimer ton compte à tout moment depuis Profil → Paramètres. La suppression est ' +
        'définitive et entraîne l’effacement de tes contenus.',
    ],
  },
  {
    heading: '4. Usage acceptable',
    paragraphs: [
      'Tu t’engages à ne pas utiliser l’application à des fins illicites, à ne pas tenter d’en ' +
        'perturber le fonctionnement, d’en contourner les limitations techniques ou d’en extraire ' +
        'massivement les données.',
      'En cas de manquement, l’accès au service peut être suspendu ou résilié.',
    ],
  },
  {
    heading: '5. Contenus que tu crées',
    paragraphs: [
      'Tu restes propriétaire des recettes et des notes que tu enregistres. Tu accordes uniquement ' +
        'l’autorisation technique nécessaire pour les stocker et te les réafficher dans l’app.',
      'Tu es responsable de ces contenus et garantis disposer des droits nécessaires, notamment si ' +
        'tu importes une recette depuis un lien externe.',
    ],
  },
  {
    heading: '6. Informations sur les cafés',
    paragraphs: [
      'Les fiches des établissements (nom, adresse, horaires, notes, photos) proviennent de services ' +
        'tiers de cartographie et d’annuaire de lieux. Elles sont fournies en l’état.',
      'Ces informations peuvent être incomplètes, obsolètes ou inexactes : horaires modifiés, ' +
        'établissement fermé, adresse erronée. Nous ne pouvons pas en garantir l’exactitude et te ' +
        'recommandons de vérifier auprès de l’établissement avant de te déplacer.',
      'Les itinéraires ouvrent l’application de cartographie de ton téléphone et sont soumis aux ' +
        'conditions de celle-ci. Reste attentif à ton environnement lors de tes déplacements.',
    ],
  },
  {
    heading: '7. Propriété intellectuelle',
    paragraphs: [
      'L’application, son nom, son identité visuelle et son code sont protégés. Cette autorisation ' +
        'd’utilisation ne te transfère aucun droit de propriété sur ces éléments.',
      'Les données cartographiques et les fiches de lieux restent la propriété de leurs fournisseurs ' +
        'respectifs.',
    ],
  },
  {
    heading: '8. Disponibilité et responsabilité',
    paragraphs: [
      'Le service peut être interrompu pour maintenance, mise à jour, ou en raison d’une défaillance ' +
        'd’un service tiers. Aucune disponibilité continue n’est garantie.',
      'L’application est fournie sans garantie d’adéquation à un usage particulier. Notre ' +
        'responsabilité ne saurait être engagée pour les dommages indirects résultant de ' +
        'l’utilisation du service, ni pour les informations erronées provenant des services tiers ' +
        'mentionnés à l’article 6.',
      'Aucune de ces limitations ne s’applique en cas de faute lourde ou dans les cas où la loi ne ' +
        'permet pas de les écarter, notamment envers les consommateurs.',
    ],
  },
  {
    heading: '9. Données personnelles',
    paragraphs: [
      'Le traitement de tes données est décrit dans la politique de confidentialité, accessible ' +
        'depuis le même menu que ce document.',
    ],
  },
  {
    heading: '10. Évolution des conditions',
    paragraphs: [
      'Ces conditions peuvent être modifiées, notamment pour accompagner de nouvelles ' +
        'fonctionnalités. En cas de changement important, tu en seras informé dans l’application. ' +
        'Continuer à utiliser le service après cette information vaut acceptation.',
    ],
  },
  {
    heading: '11. Droit applicable',
    paragraphs: [
      'Ces conditions sont soumises au droit français. En cas de litige, une solution amiable sera ' +
        'recherchée en priorité. À défaut, les tribunaux compétents seront ceux désignés par les ' +
        'règles applicables, notamment celles protectrices des consommateurs.',
    ],
  },
];

export default function TermsScreen() {
  return (
    <LegalDocument
      title="Conditions d’utilisation"
      intro={INTRO}
      sections={SECTIONS}
    />
  );
}
