import { ArticlePreview } from './shared';
import type { PreviewProps } from './shared';

const ToolkitPreview = (props: PreviewProps) => (
  <ArticlePreview {...props} collectionLabel="Toolkit" />
);

export default ToolkitPreview;
