// Icon set — minimal stroke icons in the Lucide / Heroicons family.
// Every icon accepts {size, className, ...rest} and renders an inline SVG.

const Icon = ({ children, size = 18, className = '', strokeWidth = 1.75, ...rest }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...rest}
  >
    {children}
  </svg>
);

const IconLogo = (p) => (
  <Icon {...p} strokeWidth={2}>
    <path d="M12 21s-7.5-4.5-9.5-9.5C1 7 4.5 3 9 4c1.7.4 2.6 1.3 3 2 .4-.7 1.3-1.6 3-2 4.5-1 8 3 6.5 7.5C19.5 16.5 12 21 12 21Z" />
    <path d="M9 12h2.5l1-2 1.5 4 1-2H17" />
  </Icon>
);

const IconHome      = (p) => (<Icon {...p}><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"/></Icon>);
const IconCheckSq   = (p) => (<Icon {...p}><rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="m8 12 3 3 5-6"/></Icon>);
const IconInbox     = (p) => (<Icon {...p}><path d="M3 13h4l2 3h6l2-3h4"/><path d="M5 5h14l2 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6Z"/></Icon>);
const IconUsers     = (p) => (<Icon {...p}><circle cx="9" cy="8" r="3.25"/><path d="M2.75 19a6.25 6.25 0 0 1 12.5 0"/><path d="M16 4a3.25 3.25 0 0 1 0 6.5"/><path d="M21.25 19a6.25 6.25 0 0 0-4-5.83"/></Icon>);
const IconShield    = (p) => (<Icon {...p}><path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/></Icon>);
const IconLogout    = (p) => (<Icon {...p}><path d="M14 5V4a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1"/><path d="M10 12h11"/><path d="m18 8 4 4-4 4"/></Icon>);
const IconPlus      = (p) => (<Icon {...p}><path d="M12 5v14"/><path d="M5 12h14"/></Icon>);
const IconSearch    = (p) => (<Icon {...p}><circle cx="11" cy="11" r="6.5"/><path d="m20 20-3.5-3.5"/></Icon>);
const IconPencil    = (p) => (<Icon {...p}><path d="M4 20h4l11-11-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></Icon>);
const IconTrash     = (p) => (<Icon {...p}><path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7v13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7"/><path d="M10 11v6"/><path d="M14 11v6"/></Icon>);
const IconChevDown  = (p) => (<Icon {...p}><path d="m6 9 6 6 6-6"/></Icon>);
const IconChevRight = (p) => (<Icon {...p}><path d="m9 6 6 6-6 6"/></Icon>);
const IconClose     = (p) => (<Icon {...p}><path d="M6 6l12 12"/><path d="M18 6 6 18"/></Icon>);
const IconBell      = (p) => (<Icon {...p}><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2H4.5L6 16Z"/><path d="M10 20a2 2 0 0 0 4 0"/></Icon>);
const IconBolt      = (p) => (<Icon {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/></Icon>);
const IconAlert     = (p) => (<Icon {...p}><path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4"/><circle cx="12" cy="17" r=".6" fill="currentColor"/></Icon>);
const IconClock     = (p) => (<Icon {...p}><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></Icon>);
const IconCal       = (p) => (<Icon {...p}><rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M3.5 10h17"/><path d="M8 3v4"/><path d="M16 3v4"/></Icon>);
const IconUser      = (p) => (<Icon {...p}><circle cx="12" cy="8" r="3.5"/><path d="M4 20a8 8 0 0 1 16 0"/></Icon>);
const IconMenu      = (p) => (<Icon {...p}><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></Icon>);
const IconFilter    = (p) => (<Icon {...p}><path d="M3 5h18l-7 9v6l-4-2v-4L3 5Z"/></Icon>);
const IconHistory   = (p) => (<Icon {...p}><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 8v4l3 2"/></Icon>);
const IconCheck     = (p) => (<Icon {...p}><path d="m5 12 5 5L20 7"/></Icon>);
const IconCircle    = (p) => (<Icon {...p}><circle cx="12" cy="12" r="9"/></Icon>);
const IconDot       = (p) => (<Icon {...p} strokeWidth={0}><circle cx="12" cy="12" r="4" fill="currentColor"/></Icon>);
const IconSpark     = (p) => (<Icon {...p}><path d="M12 3v4"/><path d="M12 17v4"/><path d="M3 12h4"/><path d="M17 12h4"/><path d="m6 6 2.5 2.5"/><path d="m15.5 15.5 2.5 2.5"/><path d="m18 6-2.5 2.5"/><path d="m8.5 15.5 -2.5 2.5"/></Icon>);
const IconDrag      = (p) => (<Icon {...p} strokeWidth={2}><circle cx="9" cy="6" r=".8" fill="currentColor"/><circle cx="9" cy="12" r=".8" fill="currentColor"/><circle cx="9" cy="18" r=".8" fill="currentColor"/><circle cx="15" cy="6" r=".8" fill="currentColor"/><circle cx="15" cy="12" r=".8" fill="currentColor"/><circle cx="15" cy="18" r=".8" fill="currentColor"/></Icon>);
const IconList      = (p) => (<Icon {...p}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6" strokeWidth={3}/><line x1="3" y1="12" x2="3.01" y2="12" strokeWidth={3}/><line x1="3" y1="18" x2="3.01" y2="18" strokeWidth={3}/></Icon>);
const IconColumns   = (p) => (<Icon {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18"/></Icon>);
const IconArchive   = (p) => (<Icon {...p}><path d="M3 9V18a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9"/><path d="M1 5h22v4H1z"/><path d="M10 13h4"/></Icon>);
const IconRotateCcw = (p) => (<Icon {...p}><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8"/><path d="M3 3v5h5"/></Icon>);
const IconNote      = (p) => (<Icon {...p}><path d="M5 4h14a1 1 0 0 1 1 1v9l-6 6H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"/><path d="M14 20v-5a1 1 0 0 1 1-1h5"/></Icon>);
const IconStar      = ({ filled, ...p }) => (<Icon {...p}><path d="m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6L12 16.8 6.6 19.7l1.1-6L3.2 9.4l6.1-.8L12 3Z" fill={filled ? 'currentColor' : 'none'}/></Icon>);
const IconShare     = (p) => (<Icon {...p}><circle cx="6" cy="12" r="2.5"/><circle cx="17" cy="5.5" r="2.5"/><circle cx="17" cy="18.5" r="2.5"/><path d="m8.3 10.8 6.4-4M8.3 13.2l6.4 4"/></Icon>);
const IconPaperclip = (p) => (<Icon {...p}><path d="M21 12.5 12 21.5a5.5 5.5 0 0 1-7.8-7.8l9-9a3.7 3.7 0 0 1 5.2 5.2l-8.6 8.6a1.85 1.85 0 0 1-2.6-2.6l8-8"/></Icon>);
const IconFlow      = (p) => (<Icon {...p}><rect x="3" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="16" width="7" height="5" rx="1.5"/><path d="M6.5 8v4a2 2 0 0 0 2 2h7a2 2 0 0 1 2 2v0"/></Icon>);
const IconBook      = (p) => (<Icon {...p}><path d="M4 19V5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2Z"/><path d="M4 19a2 2 0 0 0 2 2h14"/><path d="M9 7h7"/></Icon>);
const IconArrowLeft = (p) => (<Icon {...p}><path d="M19 12H5"/><path d="m11 18-6-6 6-6"/></Icon>);
const IconLayout    = (p) => (<Icon {...p}><rect x="3" y="3" width="18" height="18" rx="2.5"/><path d="M3 9h18"/><path d="M9 9v12"/></Icon>);

Object.assign(window, {
  Icon, IconLogo, IconHome, IconCheckSq, IconInbox, IconUsers, IconShield,
  IconLogout, IconPlus, IconSearch, IconPencil, IconTrash, IconChevDown,
  IconChevRight, IconClose, IconBell, IconBolt, IconAlert, IconClock, IconCal,
  IconUser, IconMenu, IconFilter, IconHistory, IconCheck, IconCircle, IconDot,
  IconSpark, IconDrag, IconList, IconColumns, IconArchive, IconRotateCcw,
  IconNote, IconStar, IconShare, IconPaperclip, IconFlow, IconBook,
  IconArrowLeft, IconLayout,
});
