/**
 * @file philosophy-cards.ts
 * @purpose Inhaltsstruktur der Seite „Unsere Philosophie“.
 */

export type PhilosophyCardDefinition = {
  index: number;
  icon: string;
  titleKey: string;
  descriptionKey: string;
  imageKey: string;
  imageAltKey: string;
  captionKey: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultImage: string;
  defaultAlt: string;
  defaultCaption: string;
};

export const PHILOSOPHY_CARDS: PhilosophyCardDefinition[] = [
  {
    index: 1,
    icon: "clock",
    titleKey: "philosophy.card1.title",
    descriptionKey: "philosophy.card1.description",
    imageKey: "philosophy.card1.image",
    imageAltKey: "philosophy.card1.image_alt",
    captionKey: "philosophy.card1.caption",
    defaultTitle: "Geduld im Handwerk",
    defaultDescription:
      "Gutes Fleisch, saubere Technik und Ruhe in jedem Arbeitsschritt — Qualität braucht Zeit, nicht Eile.",
    defaultImage: "/images/philosophy/geduld-im-handwerk.png",
    defaultAlt: "Fleischermeister bei der Wurstreifung — Geduld im Handwerk",
    defaultCaption: "",
  },
  {
    index: 2,
    icon: "leaf",
    titleKey: "philosophy.card2.title",
    descriptionKey: "philosophy.card2.description",
    imageKey: "philosophy.card2.image",
    imageAltKey: "philosophy.card2.image_alt",
    captionKey: "philosophy.card2.caption",
    defaultTitle: "Respekt vor dem Tier",
    defaultDescription:
      "Ich verarbeite bewusst, achtsam und ohne Verschwendung — aus Achtung vor dem Leben, das uns Nahrung schenkt.",
    defaultImage: "/images/philosophy/respekt-vor-dem-tier.png",
    defaultAlt: "Rind, Schwein, Schafe und Hühner auf der Weide — Respekt vor dem Tier",
    defaultCaption: "",
  },
  {
    index: 3,
    icon: "spark",
    titleKey: "philosophy.card3.title",
    descriptionKey: "philosophy.card3.description",
    imageKey: "philosophy.card3.image",
    imageAltKey: "philosophy.card3.image_alt",
    captionKey: "philosophy.card3.caption",
    defaultTitle: "Gute Zutaten",
    defaultDescription:
      "Herkunft, Frische und Transparenz stehen an erster Stelle — denn der Geschmack beginnt bei der Auswahl.",
    defaultImage: "/images/philosophy/gute-zutaten.png",
    defaultAlt: "Frisches Gemüse, Kräuter und Gewürze auf dem Werktisch — Gute Zutaten",
    defaultCaption: "",
  },
  {
    index: 4,
    icon: "check",
    titleKey: "philosophy.card4.title",
    descriptionKey: "philosophy.card4.description",
    imageKey: "philosophy.card4.image",
    imageAltKey: "philosophy.card4.image_alt",
    captionKey: "philosophy.card4.caption",
    defaultTitle: "So wenig Zusatzstoffe wie möglich",
    defaultDescription:
      "Ich setze auf Verständnis statt Zusatzstoffkatalog — bewusst, reduziert und nachvollziehbar produziert.",
    defaultImage: "/images/philosophy/wenig-zusatzstoffe.png",
    defaultAlt: "Natürliche Gewürze statt Industrie-Zusatzstoffe — So wenig Zusatzstoffe wie möglich",
    defaultCaption: "",
  },
  {
    index: 5,
    icon: "unlock",
    titleKey: "philosophy.card5.title",
    descriptionKey: "philosophy.card5.description",
    imageKey: "philosophy.card5.image",
    imageAltKey: "philosophy.card5.image_alt",
    captionKey: "philosophy.card5.caption",
    defaultTitle: "Freiheit für den eigenen Geschmack",
    defaultDescription:
      "Keine starren Industrierezepte — du entwickelst Aromen, Würzung und Charakter nach deinem eigenen Gusto.",
    defaultImage: "/images/philosophy/freiheit-geschmack.png",
    defaultAlt: "Gewürze, Kräuter und Rezeptnotizen — Freiheit für den eigenen Geschmack",
    defaultCaption: "",
  },
  {
    index: 6,
    icon: "medal",
    titleKey: "philosophy.card6.title",
    descriptionKey: "philosophy.card6.description",
    imageKey: "philosophy.card6.image",
    imageAltKey: "philosophy.card6.image_alt",
    captionKey: "philosophy.card6.caption",
    defaultTitle: "Fleischermeister aus Leidenschaft",
    defaultDescription:
      "Über drei Jahrzehnte Handwerk, Wissen teilen und andere auf ihrem Weg begleiten — das ist meine Motivation.",
    defaultImage: "/images/philosophy/fleischermeister-leidenschaft.png",
    defaultAlt: "Meisterbrief — Fleischermeister Ralf Hermanski, Handwerkskammer Düsseldorf 1994",
    defaultCaption: "",
  },
];
