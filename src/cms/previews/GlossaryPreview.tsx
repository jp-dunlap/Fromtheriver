import { ArticlePreview } from './shared';
import type { PreviewProps } from './shared';

const GlossaryPreview = (props: PreviewProps) => (
  <ArticlePreview {...props} collectionLabel="Glossary Entry" />
);

export default GlossaryPreview;
