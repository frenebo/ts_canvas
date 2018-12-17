using System.Collections.Generic;
using Newtonsoft.Json;

namespace ModelChangeReqs {
  class ChangeReqDispatcher {
    public static void dispatchReqString(string str) {
      GenericReq genericReq = GenericReq.fromJson(str);

      if (genericReq.type == "moveVertex") {
        System.Console.WriteLine("moveVertex");
      } else if (genericReq.type == "cloneVertex") {
        System.Console.WriteLine("cloneVertex");
      } else if (genericReq.type == "createEdge") {
        System.Console.WriteLine("createEdge");
      } else if (genericReq.type == "deleteVertex") {
        System.Console.WriteLine("deleteVertex");
      } else if (genericReq.type == "setLayerFields") {
        System.Console.WriteLine("setLayerFields");
      }
    }
  }

  class GenericReq {
    public static GenericReq fromJson(string str) {
      return JsonConvert.DeserializeObject<GenericReq>(str);
    }
    public string toJson() {
      return JsonConvert.SerializeObject(this);
    }

    public string type;
  }

  class MoveVertex {
    public static MoveVertex fromJson(string str) {
      return JsonConvert.DeserializeObject<MoveVertex>(str);
    }
    public string toJson() {
      return JsonConvert.SerializeObject(this);
    }

    public string type = "moveVertex";
    public string vertexId;
    public float x;
    public float y;
  }

  class CloneVertex {
    public static CloneVertex fromJson(string str) {
      return JsonConvert.DeserializeObject<CloneVertex>(str);
    }
    public string toJson() {
      return JsonConvert.SerializeObject(this);
    }

    public string type = "cloneVertex";
    public string newVertexId;
    public string sourceVertexId;
    public float x;
    public float y;
  }

  class CreateEdge {
    public static CreateEdge fromJson(string str) {
      return JsonConvert.DeserializeObject<CreateEdge>(str);
    }
    public string toJson() {
      return JsonConvert.SerializeObject(this);
    }

    public string type = "createEdge";
    public string newEdgeId;
    public string sourceVertexId;
    public string sourcePortId;
    public string targetVertexId;
    public string targetPortId;
  }

  class DeleteVertex {
    public static DeleteVertex fromJson(string str) {
      return JsonConvert.DeserializeObject<DeleteVertex>(str);
    }
    public string toJson() {
      return JsonConvert.SerializeObject(this);
    }

    public string type = "deleteVertex";
    public string vertexId;
  }

  class DeleteEdge {
    public static DeleteEdge fromJson(string str) {
      return JsonConvert.DeserializeObject<DeleteEdge>(str);
    }
    public string toJson() {
      return JsonConvert.SerializeObject(this);
    }

    public string type = "deleteEdge";
    public string edgeId;
  }

  class SetLayerFields {
    public static SetLayerFields fromJson(string str) {
      return JsonConvert.DeserializeObject<SetLayerFields>(str);
    }
    public string toJson() {
      return JsonConvert.SerializeObject(this);
    }

    public string type = "setLayerFields";
    public string layerId;
    public Dictionary<string, string> fieldValues;
  }
}

// {
//   type: "moveVertex";
//   vertexId: string;
//   x: number;
//   y: number;
// } | {
//   type: "cloneVertex";
//   newVertexId: string;
//   sourceVertexId: string;
//   x: number;
//   y: number;
// } | {
//   type: "createEdge";
//   newEdgeId: string;
//   sourceVertexId: string;
//   sourcePortId: string;
//   targetVertexId: string;
//   targetPortId: string;
// } | {
//   type: "deleteVertex";
//   vertexId: string;
// } | {
//   type: "deleteEdge";
//   edgeId: string;
// } | {
//   type: "setLayerFields";
//   layerId: string;
//   fieldValues: {
//     [key: string]: string;
//   };
// }
