import Block from './block'
import { headlessActions } from './constants'
import BaseGenerator from './base-generator'

export default class HaibunCodeGenerator extends BaseGenerator {
  constructor(options: any) {
    super(options)
  }

  generate(events: any) {
    const parsed = this._parseEvents(events);
    return parsed;
  }

  _handleViewport(width: number, height: number) {
    return new Block(this._frameId, {
      type: headlessActions.VIEWPORT,
      value: `await ${this._frame}.setViewportSize({ width: ${width}, height: ${height} })`,
    })
  }

  _handleChange(selector: any, value: any) {
    return new Block(this._frameId, {
      type: headlessActions.CHANGE,
      value: `await ${this._frame}.selectOption('${selector}', '${value}')`,
    })
  }
}

