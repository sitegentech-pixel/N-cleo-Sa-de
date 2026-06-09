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

Object.assign(window, {
  Icon, IconLogo, IconHome, IconCheckSq, IconInbox, IconUsers, IconShield,
  IconLogout, IconPlus, IconSearch, IconPencil, IconTrash, IconChevDown,
  IconChevRight, IconClose, IconBell, IconBolt, IconAlert, IconClock, IconCal,
  IconUser, IconMenu, IconFilter, IconHistory, IconCheck, IconCircle, IconDot,
  IconSpark, IconDrag, IconList, IconColumns, IconArchive, IconRotateCcw,
});
