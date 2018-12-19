using System.Collections.Generic;
using ValueWrappers;

namespace Layers {
  public class MissingValueNameException : System.Exception {
    public MissingValueNameException(string message) : base(message) {}
  }

  public abstract class Layer {
    public abstract string getType();

    public abstract List<string> getValueNames();

    public abstract void setValueString(string valueName, string newValue);

    public abstract string getValueString(string valueName);

    public abstract bool getValueIsReadonly(string valueName);
  }

  internal class RepeatLayer : Layer {
    private readonly string inputShapeName = "inputShape";
    private readonly ShapeWrapper inputShape = new ShapeWrapper();

    private readonly string outputShapeName = "outputShape";
    private readonly ShapeWrapper outputShape = new ShapeWrapper();

    public override string getType() {
      return "Repeat";
    }

    public override List<string> getValueNames() {
      return new List<string>() {
        this.inputShapeName,
        this.outputShapeName,
      };
    }

    public override void setValueString(string valueName, string newValue) {
      if (valueName == this.inputShapeName) this.inputShape.setFromString(newValue);
      else if (valueName == this.outputShapeName) this.outputShape.setFromString(newValue);
      else throw new MissingValueNameException(newValue);
    }

    public override string getValueString(string valueName) {
      if (valueName == this.inputShapeName) return this.inputShape.getString();
      else if (valueName == this.outputShapeName) return this.outputShape.getString();
      else throw new MissingValueNameException(valueName);
    }

    public override bool getValueIsReadonly(string valueName) {
      if (valueName == this.inputShapeName) return false;
      else if (valueName == this.outputShapeName) return true;
      else throw new MissingValueNameException(valueName);
    }
  }
}
