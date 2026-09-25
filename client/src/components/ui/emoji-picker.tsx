import { EmojiPicker as EmojiPickerPrimitive } from 'frimousse'

import { cn } from '@/lib/utils'

type EmojiPickerProps = {
  onSelect: (emoji: string) => void
  className?: string
}

export function EmojiPicker({ onSelect, className }: EmojiPickerProps) {
  return (
    <EmojiPickerPrimitive.Root
      columns={8}
      onEmojiSelect={({ emoji }) => onSelect(emoji)}
      className={cn('isolate flex h-80 w-fit flex-col', className)}
    >
      <EmojiPickerPrimitive.Search
        placeholder="Search emoji…"
        className="mx-2 mt-2 h-9 appearance-none rounded-md bg-muted px-2.5 text-sm outline-none placeholder:text-muted-foreground"
      />
      <EmojiPickerPrimitive.Viewport className="relative flex-1 outline-none">
        <EmojiPickerPrimitive.Loading className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          Loading…
        </EmojiPickerPrimitive.Loading>
        <EmojiPickerPrimitive.Empty className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          No emoji found.
        </EmojiPickerPrimitive.Empty>
        <EmojiPickerPrimitive.List
          className="select-none pb-2"
          components={{
            CategoryHeader: ({ category, ...props }) => (
              <div
                className="bg-popover px-3 pb-1.5 pt-3 text-xs font-medium text-muted-foreground"
                {...props}
              >
                {category.label}
              </div>
            ),
            Row: ({ children, ...props }) => (
              <div className="scroll-my-1 px-2" {...props}>
                {children}
              </div>
            ),
            Emoji: ({ emoji, ...props }) => (
              <button
                className="flex size-8 items-center justify-center rounded-md text-lg data-[active]:bg-muted"
                {...props}
              >
                {emoji.emoji}
              </button>
            ),
          }}
        />
      </EmojiPickerPrimitive.Viewport>
    </EmojiPickerPrimitive.Root>
  )
}
