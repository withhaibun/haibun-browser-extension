import HaibunCodeGenerator from './haibun'

export default class CodeGenerator {
  constructor(options = {}) {
    this.haibunGenerator = new HaibunCodeGenerator(options)
  }

  generate(recording) {
    return {
      haibun: this.haibunGenerator.generate(recording),
    }
  }
}
