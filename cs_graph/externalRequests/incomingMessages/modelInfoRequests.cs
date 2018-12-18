using Newtonsoft.Json;
using System.Collections.Generic;

// fields are assigned to from json
#pragma warning disable 0649
namespace ModelInfoRequests {
  public static class Dispatcher {
    public static void dispatch(string str) {
      GenericModelInfoReq genericReq = JsonConvert.DeserializeObject<GenericModelInfoReq>(str);

      if (genericReq.type == "validateEdge") {
        ValidateEdge.dispatch(str);
      } else if (genericReq.type == "edgesBetweenVertices") {
        EdgesBetweenVertices.dispatch(str);
      } else if (genericReq.type == "fileIsOpen") {
        FileIsOpen.dispatch(str);
      } else if (genericReq.type == "savedFileNames") {
        SavedFileNames.dispatch(str);
      } else if (genericReq.type == "getPortInfo") {
        GetPortInfo.dispatch(str);
      } else if (genericReq.type == "getLayerInfo") {
        GetLayerInfo.dispatch(str);
      } else if (genericReq.type == "validateValue") {
        ValidateValue.dispatch(str);
      } else if (genericReq.type == "compareValue") {
        CompareValue.dispatch(str);
      } else if (genericReq.type == "validateLayerFields") {
        ValidateLayerFields.dispatch(str);
      } else if (genericReq.type == "getUniqueEdgeIds") {
        GetUniqueEdgeIds.dispatch(str);
      } else if (genericReq.type == "getUniqueVertexIds") {
        GetUniqueVertexIds.dispatch(str);
      } else if (genericReq.type == "valueIsReadonly") {
        ValueIsReadonly.dispatch(str);
      } else if (genericReq.type == "getGraphData") {
        GetGraphData.dispatch(str);
      }
    }
  }
  internal class GenericModelInfoReq {
    public string type;
  }
  internal class ValidateEdge {
    public static void dispatch(string str) {
      ValidateEdge validateEdge = JsonConvert.DeserializeObject<ValidateEdge>(str);
      System.Console.WriteLine("unimplemented");
    }

    public string edgeId;
    public string sourceVertexId;
    public string sourcePortId;
    public string targetVertexId;
    public string targetPortId;
  }

  internal class EdgesBetweenVertices {
    public static void dispatch(string str) {
      EdgesBetweenVertices edgesBetweenVertices = JsonConvert.DeserializeObject<EdgesBetweenVertices>(str);
      System.Console.WriteLine("unimplemented");
    }

    public string[] vertexIds;
  }

  internal class FileIsOpen {
    public static void dispatch(string str) {
      FileIsOpen fileIsOpen = JsonConvert.DeserializeObject<FileIsOpen>(str);
      System.Console.WriteLine("unimplemented");
    }
  }

  internal class SavedFileNames {
    public static void dispatch(string str) {
      SavedFileNames savedFileNames = JsonConvert.DeserializeObject<SavedFileNames>(str);
      System.Console.WriteLine("unimplemented");
    }
  }

  internal class GetPortInfo {
    public static void dispatch(string str) {
      GetPortInfo getPortInfo = JsonConvert.DeserializeObject<GetPortInfo>(str);
      System.Console.WriteLine("unimplemented");
    }

    public string vertexId;
    public string portId;
  }

  internal class GetLayerInfo {
    public static void dispatch(string str) {
      GetLayerInfo getLayerInfo = JsonConvert.DeserializeObject<GetLayerInfo>(str);
      System.Console.WriteLine("unimplemented");
    }

    public string layerId;
  }

  internal class ValidateValue {
    public static void dispatch(string str) {
      ValidateValue validateValue = JsonConvert.DeserializeObject<ValidateValue>(str);
      System.Console.WriteLine("unimplemented");
    }

    public string layerId;
    public string valueId;
    public string newValue;
  }

  internal class CompareValue {
    public static void dispatch(string str) {
      CompareValue compareValue = JsonConvert.DeserializeObject<CompareValue>(str);
      System.Console.WriteLine("unimplemented");
    }

    public string layerId;
    public string valueId;
    public string compareValue;
  }

  internal class ValidateLayerFields {
    public static void dispatch(string str) {
      ValidateLayerFields validateLayerFields = JsonConvert.DeserializeObject<ValidateLayerFields>(str);
      System.Console.WriteLine("unimplemented");
    }

    public string layerId;
    public Dictionary<string, string> fieldValues;
  }

  internal class GetUniqueEdgeIds {
    public static void dispatch(string str) {
      GetUniqueEdgeIds getUniqueEdgeIds = JsonConvert.DeserializeObject<GetUniqueEdgeIds>(str);
      System.Console.WriteLine("unimplemented");
    }

    public int count;
  }

  internal class GetUniqueVertexIds {
    public static void dispatch(string str) {
      GetUniqueVertexIds getUniqueVertexIds = JsonConvert.DeserializeObject<GetUniqueVertexIds>(str);
      System.Console.WriteLine("unimplemented");
    }

    public int count;
  }

  internal class ValueIsReadonly {
    public static void dispatch(string str) {
      ValueIsReadonly valueIsReadonly = JsonConvert.DeserializeObject<ValueIsReadonly>(str);
      System.Console.WriteLine("unimplemented");
    }

    public string layerId;
    public string valueId;
  }

  internal class GetGraphData {
    public static void dispatch(string str) {
      GetGraphData getGraphData = JsonConvert.DeserializeObject<GetGraphData>(str);
      System.Console.WriteLine("unimplemented");
    }
  }
}
#pragma warning restore 0649
