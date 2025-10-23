import { ArticlePreview } from './shared';
import type { PreviewProps } from './shared';

const CallToActionPreview = (props: PreviewProps) => (
  <ArticlePreview {...props} collectionLabel="Call to Action" />
);

export default CallToActionPreview;
