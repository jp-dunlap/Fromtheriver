import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import SceneAudioControls from './SceneAudioControls';

const meta: Meta<typeof SceneAudioControls> = {
  title: 'River/SceneAudioControls',
  component: SceneAudioControls,
  args: {
    sceneId: 'roots',
    sceneTitle: 'The Roots',
    audioAvailable: true,
    audioState: { isPlaying: false, volume: 0.7 },
    onPlay: fn(),
    onPause: fn(),
    onToggleAutoPlay: fn(),
    autoPlay: false,
    volume: 0.7,
    onVolumeChange: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof SceneAudioControls>;

export const Idle: Story = {};

export const Playing: Story = {
  args: {
    audioState: { isPlaying: true, volume: 0.7 },
  },
};

export const AutoNarration: Story = {
  args: {
    autoPlay: true,
  },
};
