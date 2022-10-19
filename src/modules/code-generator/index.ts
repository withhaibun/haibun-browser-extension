import HaibunCodeGenerator from './haibun'

export default class CodeGenerator {
  haibunGenerator: HaibunCodeGenerator
  constructor(options = {}) {
    this.haibunGenerator = new HaibunCodeGenerator(options)
  }

  generate(recording: any) {
    return {
      haibun: this.haibunGenerator.generate(recording),
    }
  }
}
