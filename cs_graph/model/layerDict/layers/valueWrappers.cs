using System.Collections.Generic;
using System.Text.RegularExpressions;

namespace ValueWrappers {
  public class ValueParseException : System.Exception {
    public ValueParseException(string message) : base(message) {}
  }

  public class WrapperStringInterface {
    private System.Action<string> internalSetFromString;
    private System.Func<string, string> internalValidateString;
    private System.Func<string> internalGetStringValue;
    private System.Func<string, bool> internalCompareStringValue;

    internal WrapperStringInterface(
      System.Action<string> internalSetFromString,
      System.Func<string, string> internalValidateString,
      System.Func<string> internalGetStringValue,
      System.Func<string, bool> internalCompareStringValue
    ) {
      this.internalSetFromString = internalSetFromString;
      this.internalValidateString = internalValidateString;
      this.internalGetStringValue = internalGetStringValue;
      this.internalCompareStringValue = internalCompareStringValue;
    }

    public void setFromString(string str) {
      this.internalSetFromString(str);
    }

    public string validateStringValue(string str) {
      return this.internalValidateString(str);
    }

    public bool compareStringValue(string compareVal) {
      return this.internalCompareStringValue(compareVal);
    }

    public string getStringValue() {
      return this.internalGetStringValue();
    }
  }

  public abstract class ValueWrapper<T> {
    public ValueWrapper(T value) {
      string validated = this.validateVal(value);
      if (validated != null) {
        throw new System.Exception(validated);
      }
      
      this.value = value;
    }

    private T value;

    public T getValue() {
      return this.cloneVal(this.value);
    }

    public void setValue(T value) {
      string validated = this.validateVal(value);
      if (validated != null) {
        throw new System.Exception(validated);
      }
      
      this.value = this.cloneVal(value);
    }

    public void setFromString(string str) {
      T value = this.parseVal(str);

      string validated = this.validateVal(value);
      if (validated != null) {
        throw new System.Exception(validated);
      }

      this.value = value;
    }

    public string getString() {
      return this.stringifyVal(this.value);
    }

    public string validateStringValue(string valString) {
      T value;
      try {
        value = this.parseVal(valString);
      } catch (System.Exception e) {
        return e.Message;
      }
      
      return this.validateVal(value);
    }

    public bool compareToString(string compareStr) {
      T compareVal = this.parseVal(compareStr);
      return this.compareTo(compareVal);
    }

    public bool compareTo(T compareVal) {
      return this.compareVals(this.value, compareVal);
    }

    public WrapperStringInterface getStringInterface() {
      return new WrapperStringInterface(
        (string str) => this.setFromString(str),
        (string str) => this.validateStringValue(str),
        () => this.getString(),
        (string str) => this.compareToString(str)
      );
    }

    protected abstract string stringifyVal(T value);
    protected abstract T parseVal(string str);
    protected abstract T cloneVal(T srcVal);

    protected abstract bool compareVals(T val1, T val2);
    public abstract string validateVal(T val);
  }

  public class NumberWrapper : ValueWrapper<float> {
    public NumberWrapper(float val) : base(val) {}
    protected override string stringifyVal(float value) {
      return value.ToString();
    }

    protected override bool compareVals(float val1, float val2) {
      return val1 == val2;
    }

    protected override float parseVal(string str) {
      return float.Parse(str);
    }

    protected override float cloneVal(float srcVal) {
      return srcVal;
    }

    public override string validateVal(float val) {
      if (float.IsNaN(val)) {
        return "Value is NaN: Not A Number";
      }
      return null;
    }
  }

  public class ShapeWrapper : ValueWrapper<List<float>> {
    public ShapeWrapper(List<float> val) : base (val) {}
    protected override string stringifyVal(List<float> value) {
      string returnStr = "(";
      string separator = "";

      foreach (float num in value) {
        returnStr += separator + ((int)num).ToString();
        separator = ",";
      }

      returnStr += ")";

      return returnStr;
    }

    protected override bool compareVals(List<float> val1, List<float> val2) {
      if (val1.Count != val2.Count) return false;

      for (int i = 0; i < val1.Count; i++) {
        if (val1[i] != val2[i]) return false;
      }

      return true;
    }

    public override string validateVal(List<float> value) {
      for (int i = 0; i < value.Count; i++) {
        float dim = value[i];
        
        if (dim != System.Math.Floor(dim)) {
          return $"Dimension {i + 1} must be integer";
        }
      }

      return null;
    }

    protected override List<float> parseVal(string str) {
      char[] whitespaceChars = { ' ', '\n', '\t' };

      string trimmed = str.Trim(whitespaceChars);
      if (trimmed[0] != '(') {
        throw new ValueParseException("Value text must begin with an open parenthesis");
      }
      if (trimmed[trimmed.Length - 1] != ')') {
        throw new ValueParseException("Value text must begin with an open parenthesis");
      }

      string[] untrimmedDimStrings = trimmed.Substring(1, trimmed.Length - 2).Split(',');

      string pattern = @"^[+\-]?(?:\d+(?:\.\d*)?|\.\d+)$";
      Regex dimTester = new Regex(pattern);

      if (untrimmedDimStrings.Length == 1 && untrimmedDimStrings[0].Trim(whitespaceChars) == "") {
        // leave list empty, instead of trying to parse the empty "dimension" between the open and close parentheses.
        return new List<float>();
      } else {
        List<float> dims = new List<float>();

        foreach (string untrimmedDim in untrimmedDimStrings) {
          string trimmedDim = untrimmedDim.Trim(whitespaceChars);
          if (!dimTester.IsMatch(trimmedDim)) {
            throw new ValueParseException("Value dimension could not be parsed");
          }
          float floatDim = float.Parse(trimmedDim);

          dims.Add(floatDim);
        }
        
        return dims;
      }
    }

    protected override List<float> cloneVal(List<float> val) {
      return new List<float>(val);
    }
  }
}
