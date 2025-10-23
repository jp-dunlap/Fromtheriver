import type { ComponentType } from 'react';

import CallToActionPreview from './CallToActionPreview';
import GlossaryPreview from './GlossaryPreview';
import ResourcePreview from './ResourcePreview';
import ToolkitPreview from './ToolkitPreview';

export type CMS = {
  registerPreviewTemplate: (collectionName: string, component: ComponentType) => void;
};

export const registerPreviewTemplates = (cms: CMS) => {
  cms.registerPreviewTemplate('resources', ResourcePreview);
  cms.registerPreviewTemplate('glossary', GlossaryPreview);
  cms.registerPreviewTemplate('toolkits', ToolkitPreview);
  cms.registerPreviewTemplate('calls_to_action', CallToActionPreview);
};

export default registerPreviewTemplates;
