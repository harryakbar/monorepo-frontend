import { Button, Card } from "@repo/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Components/Card",
  component: Card,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    title: {
      control: "text",
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "This is a simple card with some content.",
  },
};

export const WithTitle: Story = {
  args: {
    title: "Card Title",
    children: "This card has a title and some content.",
  },
};

export const WithFooter: Story = {
  args: {
    title: "Card with Footer",
    children: "This card includes a footer section.",
    footer: <Button size="sm">Action</Button>,
  },
};

export const FullExample: Story = {
  args: {
    title: "Complete Card",
    children: (
      <div>
        <p className="text-gray-700 mb-4">
          This is a complete card example with title, content, and footer.
        </p>
        <p className="text-sm text-gray-500">
          You can add any content here, including forms, lists, or other components.
        </p>
      </div>
    ),
    footer: (
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm">Cancel</Button>
        <Button variant="primary" size="sm">Save</Button>
      </div>
    ),
  },
};

