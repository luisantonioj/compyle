import { useAppStore } from '../../store/appStore';
import { removeLink, removeLinkCategory, upsertLink, upsertLinkCategory } from '../../lib/db';
import type { DataSetter } from '../actionTypes';
import type { LinkCategory, LinkItem, UserData } from '../../types';

interface LinkActionOptions {
  data: UserData;
  fs: boolean;
  activeUid: string;
  setActiveData: DataSetter;
}

export function useLinkActions({ data, fs, activeUid, setActiveData }: LinkActionOptions) {
  const store = useAppStore();

  const reorderLinkCategories = (cats: LinkCategory[]) => {
    const reordered = cats.map((c, i) => ({ ...c, sort_order: i }));
    if (fs) {
      reordered.forEach((c) => void upsertLinkCategory(activeUid, c));
    } else {
      setActiveData((d) => ({ ...d, linkCategories: reordered }));
    }
  };

  const saveLinkCategory = (cat: LinkCategory) => {
    if (fs) {
      void upsertLinkCategory(activeUid, cat);
    } else {
      setActiveData((d) => {
        const existed = d.linkCategories.find((c) => c.id === cat.id);
        return {
          ...d,
          linkCategories: existed
            ? d.linkCategories.map((c) => c.id === cat.id ? cat : c)
            : [...d.linkCategories, cat],
        };
      });
    }
    store.setEditing(null);
    store.flash('Category saved');
  };

  const deleteLinkCategory = (id: string) => {
    store.setEditing(null);
    if (fs) {
      void removeLinkCategory(activeUid, id);
      data.links.filter((l) => l.categoryId === id).forEach((l) => void removeLink(activeUid, l.id));
    } else {
      setActiveData((d) => ({
        ...d,
        linkCategories: d.linkCategories.filter((c) => c.id !== id),
        links: d.links.filter((l) => l.categoryId !== id),
      }));
    }
    store.flash('Category deleted');
  };

  const archiveLinkCategory = (cat: LinkCategory) => {
    const updated = { ...cat, archived: true };
    store.setEditing(null);
    if (fs) {
      void upsertLinkCategory(activeUid, updated);
      data.links.filter((l) => l.categoryId === cat.id).forEach((l) => void upsertLink(activeUid, { ...l, archived: true }));
    } else {
      setActiveData((d) => ({
        ...d,
        linkCategories: d.linkCategories.map((c) => c.id === cat.id ? updated : c),
        links: d.links.map((l) => l.categoryId === cat.id ? { ...l, archived: true } : l),
      }));
    }
    store.flash('Category archived');
  };

  const restoreLinkCategory = (cat: LinkCategory) => {
    const updated = { ...cat, archived: false };
    store.setEditing(null);
    if (fs) {
      void upsertLinkCategory(activeUid, updated);
      data.links.filter((l) => l.categoryId === cat.id).forEach((l) => void upsertLink(activeUid, { ...l, archived: false }));
    } else {
      setActiveData((d) => ({
        ...d,
        linkCategories: d.linkCategories.map((c) => c.id === cat.id ? updated : c),
        links: d.links.map((l) => l.categoryId === cat.id ? { ...l, archived: false } : l),
      }));
    }
    store.flash('Category restored');
  };

  const reorderLinks = (reorderedCatLinks: LinkItem[]) => {
    const ordered = reorderedCatLinks.map((l, i) => ({ ...l, sort_order: i }));
    if (fs) {
      ordered.forEach((l) => void upsertLink(activeUid, l));
    } else {
      setActiveData((d) => {
        const updated = new Map(ordered.map((l) => [l.id, l]));
        return { ...d, links: d.links.map((l) => updated.get(l.id) ?? l) };
      });
    }
  };

  const saveLink = (link: LinkItem) => {
    if (fs) {
      void upsertLink(activeUid, link);
    } else {
      setActiveData((d) => {
        const existed = d.links.find((l) => l.id === link.id);
        return {
          ...d,
          links: existed ? d.links.map((l) => l.id === link.id ? link : l) : [...d.links, link],
        };
      });
    }
    store.setEditing(null);
    store.flash('Link saved');
  };

  const deleteLink = (id: string) => {
    store.setEditing(null);
    if (fs) {
      void removeLink(activeUid, id);
    } else {
      setActiveData((d) => ({ ...d, links: d.links.filter((l) => l.id !== id) }));
    }
    store.flash('Link deleted');
  };

  const archiveLink = (link: LinkItem) => {
    const updated = { ...link, archived: true };
    store.setEditing(null);
    if (fs) {
      void upsertLink(activeUid, updated);
    } else {
      setActiveData((d) => ({ ...d, links: d.links.map((l) => l.id === link.id ? updated : l) }));
    }
    store.flash('Link archived', 'Undo', () => {
      const restored = { ...link, archived: false };
      if (fs) void upsertLink(activeUid, restored);
      else setActiveData((d) => ({ ...d, links: d.links.map((l) => l.id === link.id ? restored : l) }));
      store.setToast(null);
    });
  };

  const restoreLink = (link: LinkItem) => {
    const updated = { ...link, archived: false };
    store.setEditing(null);
    if (fs) {
      void upsertLink(activeUid, updated);
    } else {
      setActiveData((d) => ({ ...d, links: d.links.map((l) => l.id === link.id ? updated : l) }));
    }
    store.flash('Link restored');
  };

  return {
    reorderLinkCategories,
    saveLinkCategory,
    deleteLinkCategory,
    archiveLinkCategory,
    restoreLinkCategory,
    reorderLinks,
    saveLink,
    deleteLink,
    archiveLink,
    restoreLink,
  };
}

