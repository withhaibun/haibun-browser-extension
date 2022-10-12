import { mount } from '@vue/test-utils'
import VueHighlightJS from 'vue3-highlightjs'

import ResultsTab from '../ResultsTab'

describe('RecordingTab.vue', () => {
  test('it has the correct pristine / empty state', () => {
    const wrapper = mount(ResultsTab)
    expect(wrapper.element).toMatchSnapshot()
    expect(wrapper.find('code.javascript').exists()).toBe(false)
  })

  test('it show a code box when there is code', () => {
    const wrapper = mount(ResultsTab, {
      global: {
        plugins: [VueHighlightJS],
      },
      props: { puppeteer: `await page.click('.class')` },
    })
    expect(wrapper.element).toMatchSnapshot()
    expect(wrapper.find('code.javascript').exists()).toBe(true)
  })

  test('it render tabs for haibun', () => {
    const wrapper = mount(ResultsTab)
    expect(wrapper.findAll('.tabs__action').length).toEqual(1)
  })

})
