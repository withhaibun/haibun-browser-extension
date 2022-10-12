import Block from '@/modules/code-generator/block'
import { headlessActions } from '@/modules/code-generator/constants'
import BaseGenerator from '@/modules/code-generator/base-generator'

export default class HaibunCodeGenerator extends BaseGenerator {
  constructor(options) {
    super(options)
  }

  generate(events) {
    const parsed = this._parseEvents(events);
    return parsed;
  }

  _handleViewport(width, height) {
    return new Block(this._frameId, {
      type: headlessActions.VIEWPORT,
      value: `await ${this._frame}.setViewportSize({ width: ${width}, height: ${height} })`,
    })
  }

  _handleChange(selector, value) {
    return new Block(this._frameId, {
      type: headlessActions.CHANGE,
      value: `await ${this._frame}.selectOption('${selector}', '${value}')`,
    })
  }
}

