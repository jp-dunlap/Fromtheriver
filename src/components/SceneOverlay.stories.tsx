import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import SceneOverlay from './SceneOverlay';
import type { Village } from '../data/types';

const sampleVillages: Village[] = [
  {
    id: 1,
    name: 'Lifta',
    name_arabic: 'لفتا',
    lat: 31.789,
    lon: 35.213,
    district: 'Jerusalem',
    story:
      'One of the few depopulated Palestinian villages that remains partially intact. Lifta was emptied in 1948 after sustaining repeated attacks from Zionist militias. The stone homes still look down upon Jerusalem as a reminder of the people who were forced from them.',
    military_operation: 'Operation Nachshon',
    destroyed_by: 'Irgun & Haganah',
    israeli_settlement: 'Jerusalem (expansion)',
  },
  {
    id: 2,
    name: 'Deir Yassin',
    name_arabic: 'دير ياسين',
    lat: 31.778,
    lon: 35.187,
    district: 'Jerusalem',
    story:
      'The site of the infamous April 9, 1948 massacre that became a turning point in the Nakba. Survivors were expelled and the village was destroyed; a psychiatric hospital now stands on its lands.',
    military_operation: 'Massacre (pre-state militia attack)',
    destroyed_by: 'Irgun & Lehi',
    israeli_settlement: 'Givat Shaul',
  },
];

const meta: Meta<typeof SceneOverlay> = {
  title: 'River/SceneOverlay',
  component: SceneOverlay,
  args: {
    sceneTitle: 'The Roots',
    description:
      'Follow the colonial timeline from the British Mandate through the Nakba and meet villages whose erasure anchors this archive.',
    villages: sampleVillages,
    onSelectVillage: fn(),
    isVisible: true,
  },
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof SceneOverlay>;

export const Default: Story = {};

export const SingleVillage: Story = {
  args: {
    villages: [sampleVillages[0]],
  },
};
