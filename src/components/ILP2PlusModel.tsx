import React from 'react';
import type { Language, TranslationDict } from '../i18n/types';
import { ILP2Model } from './ILP2Model';

interface ILP2PlusModelProps {
  lang: Language;
  dict: TranslationDict;
}

export const ILP2PlusModel: React.FC<ILP2PlusModelProps> = ({ lang, dict }) => (
  <ILP2Model lang={lang} dict={dict} variant="ilp2-plus" />
);
