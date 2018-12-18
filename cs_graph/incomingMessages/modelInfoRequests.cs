using Newtonsoft.Json;
using System.Collections.Generic;

// fields are assigned to from json
#pragma warning disable 0649
namespace ModelInfoRequests {
  class ValidateEdge {
    public static ValidateEdge fromJson(string str) {
      return JsonConvert.DeserializeObject<ValidateEdge>(str);
    }

    public string edgeId;
    public string sourceVertexId;
    public string sourcePortId;
    public string targetVertexId;
    public string targetPortId;
  }

  class EdgesBetweenVertices {
    public static EdgesBetweenVertices fromJson(string str) {
      return JsonConvert.DeserializeObject<EdgesBetweenVertices>(str);
    }

    public string[] vertexIds;
  }

  class FileIsOpen {
    public static FileIsOpen fromJson(string str) {
      return JsonConvert.DeserializeObject<FileIsOpen>(str);
    }
  }

  class SavedFileNames {
    public static SavedFileNames fromJson(string str) {
      return JsonConvert.DeserializeObject<SavedFileNames>(str);
    }
  }

  class GetPortInfo {
    public static GetPortInfo fromJson(string str) {
      return JsonConvert.DeserializeObject<GetPortInfo>(str);
    }

    public string vertexId;
    public string portId;
  }

  class GetLayerInfo {
    public static GetLayerInfo fromJson(string str) {
      return JsonConvert.DeserializeObject<GetLayerInfo>(str);
    }

    public string layerId;
  }

  class ValidateValue {
    public static ValidateValue fromJson(string str) {
      return JsonConvert.DeserializeObject<ValidateValue>(str);
    }

    public string layerId;
    public string valueId;
    public string newValue;
  }

  class CompareValue {
    public static CompareValue fromJson(string str) {
      return JsonConvert.DeserializeObject<CompareValue>(str);
    }

    public string layerId;
    public string valueId;
    public string compareValue;
  }

  class ValidateLayerFields {
    public static ValidateLayerFields fromJson(string str) {
      return JsonConvert.DeserializeObject<ValidateLayerFields>(str);
    }

    public string layerId;
    public Dictionary<string, string> fieldValues;
  }

  class GetUniqueEdgeIds {
    public static GetUniqueEdgeIds fromJson(string str) {
      return JsonConvert.DeserializeObject<GetUniqueEdgeIds>(str);
    }

    public int count;
  }

  class GetUniqueVertexIds {
    public static GetUniqueVertexIds fromJson(string str) {
      return JsonConvert.DeserializeObject<GetUniqueVertexIds>(str);
    }

    public int count;
  }

  class ValueIsReadonly {
    public static ValueIsReadonly fromJson(string str) {
      return JsonConvert.DeserializeObject<ValueIsReadonly>(str);
    }

    public string layerId;
    public string valueId;
  }

  class GetGraphData {
    public static GetGraphData fromJson(string str) {
      return JsonConvert.DeserializeObject<GetGraphData>(str);
    }
  }
}
#pragma warning restore 0649
