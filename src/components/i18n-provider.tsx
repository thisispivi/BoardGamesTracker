"use client";

import { createContext, useContext } from "react";

import {
  translate,
  type MessageDictionary,
  type MessageKey,
} from "@/lib/messages";

type Replacements = Record<string, string | number>;

const I18nContext = createContext<MessageDictionary | null>(null);

/** Makes the server-selected dictionary available to every client component. */
export function I18nProvider({
  children,
  dictionary,
}: {
  children: React.ReactNode;
  dictionary: MessageDictionary;
}) {
  return (
    <I18nContext.Provider value={dictionary}>{children}</I18nContext.Provider>
  );
}

/** Returns a small typed translator with named value interpolation. */
export function useI18n() {
  const dictionary = useContext(I18nContext);
  if (!dictionary) throw new Error("I18nProvider is missing.");
  return (key: MessageKey, replacements: Replacements = {}) =>
    translate(dictionary, key, replacements);
}
