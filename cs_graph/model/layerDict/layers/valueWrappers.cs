using System.Collections.Generic;
using System.Text.RegularExpressions;

namespace ValueWrappers {
  public class ValueParseException : System.Exception {
    public ValueParseException(string message) : base(message) {}
  }

  public abstract class ValueWrapper<T> {
    public ValueWrapper(T val) {
      this.value = val;
    }

    private T value;

    public T getValue() {
      return this.cloneVal(this.value);
    }

    public void setValue(T value) {
      this.value = this.cloneVal(value);
    }

    public void setFromString(string str) {
      this.value = this.parseVal(str);
    }

    public string getString() {
      return this.stringifyVal(this.value);
    }

    protected abstract string stringifyVal(T value);
    protected abstract T parseVal(string str);
    protected abstract T cloneVal(T srcVal);
  }

  public class NumberWrapper : ValueWrapper<float> {
    public NumberWrapper(float val) : base(val) {}
    protected override string stringifyVal(float value) {
      return value.ToString();
    }

    protected override float parseVal(string str) {
      return float.Parse(str);
    }

    protected override float cloneVal(float srcVal) {
      return srcVal;
    }
  }

  public class ShapeWrapper : ValueWrapper<List<int>> {
    public ShapeWrapper(List<int> val) : base (val) {}
    protected override string stringifyVal(List<int> value) {
      string returnStr = "(";
      string separator = "";

      foreach (int num in value) {
        returnStr += separator + num.ToString();
        separator = ",";
      }

      returnStr += ")";

      return returnStr;
    }

    protected override List<int> parseVal(string str) {
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

      List<int> dims = new List<int>();

      foreach (string untrimmedDim in untrimmedDimStrings) {
        string trimmedDim = untrimmedDim.Trim(whitespaceChars);
        if (!dimTester.IsMatch(trimmedDim)) {
          throw new ValueParseException("Value dimension could not be parsed");
        }
        float floatDim = float.Parse(trimmedDim);
        if (floatDim != System.Math.Floor(floatDim)) throw new ValueParseException("Value dimension must be integer");
        
        dims.Add((int)System.Math.Floor(floatDim));
      }

      return dims;
    }

    protected override List<int> cloneVal(List<int> val) {
      return new List<int>(val);
    }
  }
}
