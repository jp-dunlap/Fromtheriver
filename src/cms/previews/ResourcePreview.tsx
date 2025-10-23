import { ArticlePreview } from './shared';
import type { PreviewProps } from './shared';

const ResourcePreview = (props: PreviewProps) => (
  <ArticlePreview {...props} collectionLabel="Resource" />
);

export default ResourcePreview;
