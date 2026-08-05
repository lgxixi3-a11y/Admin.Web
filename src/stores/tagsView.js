import { defineStore } from 'pinia'
import {
  appendVisitedView,
  getCachedViewNames,
  isTaggableRoute,
  removeVisitedView,
  retainOnlyView,
  toVisitedView
} from '@/utils/tags-view-utils.mjs'

export const useTagsViewStore = defineStore('tagsView', {
  state: () => ({
    visitedViews: [],
    cachedViews: []
  }),
  actions: {
    addView(route) {
      if (!isTaggableRoute(route)) return

      this.visitedViews = appendVisitedView(this.visitedViews, toVisitedView(route))
      this.syncCachedViews()
    },
    delView(view) {
      this.visitedViews = removeVisitedView(this.visitedViews, view)
      this.syncCachedViews()
    },
    delOthers(view) {
      this.visitedViews = retainOnlyView(this.visitedViews, view)
      this.syncCachedViews()
    },
    delAll() {
      this.visitedViews = this.visitedViews.filter(view => view.affix)
      this.syncCachedViews()
    },
    delCachedView(name) {
      this.cachedViews = this.cachedViews.filter(cacheName => cacheName !== name)
    },
    syncCachedViews() {
      this.cachedViews = getCachedViewNames(this.visitedViews)
    }
  }
})
