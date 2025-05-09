import NewIcon from "@/icons/new.svg?jsx";
import LibraryIcon from "@/icons/library.svg?jsx";
import SettingsIcon from "@/icons/settings.svg?jsx";
import SignOutIcon from "@/icons/sign-out.svg?jsx";
import MenuIcon from "@/icons/menu.svg?jsx";
import { user } from "@/utils/sessions";

interface NavigationProps {
  showTableOfContents?: boolean;
}

export default function Navigation({ showTableOfContents }: NavigationProps) {
  return user.derive((value) =>
    value ? (
      <nav
        id="navigation"
        aria-label="Main navigation links"
        data-tooltip-position="right"
      >
        <ul>
          <li>
            <a href={value.id} className="floating" data-tooltip="Your profile">
              <img
                className="profile-image"
                src={value.imageUrl}
                alt="Profile image"
              />
            </a>
          </li>
          <li>
            <a
              href="/library"
              className="floating"
              aria-label="Library"
              data-tooltip="Library"
            >
              <LibraryIcon />
            </a>
          </li>
          <li>
            <button
              id="new-page-button"
              className="floating"
              type="button"
              data-tooltip="Create a new page"
              data-pending-text=""
            >
              <NewIcon />
            </button>
          </li>
          <li>
            <button
              id="more-button"
              className="floating"
              type="button"
              role="menuitem"
              popoverTarget="navigation-overflow"
              data-tooltip="More options"
              aria-haspopup="menu"
              aria-expanded="false"
            >
              <SettingsIcon />
            </button>
            <popover-menu id="navigation-overflow" anchor="more-button">
              <menu>
                <li>
                  <a href="/settings">
                    <SettingsIcon />
                    Account settings
                  </a>
                </li>
                <li>
                  <button id="sign-out" type="button">
                    <SignOutIcon />
                    Sign out
                  </button>
                </li>
              </menu>
            </popover-menu>
          </li>
          {showTableOfContents ? (
            <li>
              <button
                id="toc-button"
                className="floating"
                type="button"
                role="menuitem"
                popoverTarget="toc"
                data-tooltip="Table of contents"
                aria-haspopup="menu"
                aria-expanded="false"
              >
                <MenuIcon />
              </button>
              <table-of-contents
                id="toc"
                anchor="toc-button"
                role="navigation"
              />
            </li>
          ) : null}
        </ul>
      </nav>
    ) : null,
  );
}
