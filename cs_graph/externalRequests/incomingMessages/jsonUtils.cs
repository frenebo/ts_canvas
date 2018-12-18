using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Collections.Generic;

namespace JsonUtils {
  public class ConvertObjectToString : JsonConverter<string> {
    public override void WriteJson(JsonWriter writer, string value, JsonSerializer serializer) {
      throw new System.Exception("unimplemented");
    }

    public override string ReadJson(
      JsonReader reader,
      System.Type objectType,
      string existingValue,
      bool hasExistingValue,
      JsonSerializer serializer
    ) {
      return JObject.Load(reader).ToString();
    }
  }

  public class ConvertObjectArrayToStringArray : JsonConverter<List<string>> {
    public override void WriteJson(JsonWriter writer, List<string> value, JsonSerializer serializer) {
      throw new System.Exception("unimplmented");
    }

    public override List<string> ReadJson(
      JsonReader reader,
      System.Type objectType,
      List<string> existingValue,
      bool hasExistingValue,
      JsonSerializer serializer
    ) {
      List<string> vals = new List<string>();

      foreach (JToken tok in JArray.Load(reader)) {
        vals.Add(tok.ToString());
      }

      return vals;
    }
  }
}
