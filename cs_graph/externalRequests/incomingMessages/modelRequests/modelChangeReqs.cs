using System.Collections.Generic;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

// fields are assigned to from json
#pragma warning disable 0649
namespace ModelChangeRequests {
  public static class Dispatcher {
    public static void dispatch(JObject jobj) {
      string type = jobj["type"].ToString();

      if (type == "moveVertex") {
        MoveVertex.dispatch(jobj);
      } else if (type == "cloneVertex") {
        CloneVertex.dispatch(jobj);
      } else if (type == "createEdge") {
        CreateEdge.dispatch(jobj);
      } else if (type == "deleteVertex") {
        DeleteEdge.dispatch(jobj);
      } else if (type == "setLayerFields") {
        SetLayerFields.dispatch(jobj);
      }
    }
  }

  internal struct GenericReq {
    public string type;
  }

  internal struct MoveVertex {
    public static void dispatch(JObject jobj) {
      MoveVertex moveVertexReq = new MoveVertex {
        vertexId = jobj["vertexId"].ToString(),
        x = float.Parse(jobj["x"].ToString()),
        y = float.Parse(jobj["y"].ToString())
      };

      throw new System.Exception("unimplemented");
    }

    public string vertexId;
    public float x;
    public float y;
  }

  internal struct CloneVertex {
    public static void dispatch(JObject jobj) {
      CloneVertex cloneVertexReq = new CloneVertex {
        newVertexId = jobj["newVertexId"].ToString(),
        sourceVertexId = jobj["sourceVertexId"].ToString(),
        x = float.Parse(jobj["x"].ToString()),
        y = float.Parse(jobj["y"].ToString())
      };

      throw new System.Exception("unimplemented");
    }

    public string newVertexId;
    public string sourceVertexId;
    public float x;
    public float y;
  }

  internal struct CreateEdge {
    public static void dispatch(JObject jobj) {
      CreateEdge createEdgeReq = new CreateEdge {
        newEdgeId = jobj["newEdgeId"].ToString(),
        sourceVertexId = jobj["sourceVertexId"].ToString(),
        sourcePortId = jobj["sourcePortId"].ToString(),
        targetVertexId = jobj["targetVertexId"].ToString(),
        targetPortId = jobj["targetPortId"].ToString()
      };

      throw new System.Exception("unimplemented");
    }

    public string newEdgeId;
    public string sourceVertexId;
    public string sourcePortId;
    public string targetVertexId;
    public string targetPortId;
  }

  internal struct DeleteVertex {
    public static void dispatch(JObject jobj) {
      DeleteVertex deleteVertexReq = new DeleteVertex {
        vertexId = jobj["vertexId"].ToString()
      };
    }

    public string vertexId;
  }

  internal struct DeleteEdge {
    public static void dispatch(JObject jobj) {
      DeleteEdge deleteEdgeReq = new DeleteEdge {
        edgeId = jobj["edgeId"].ToString()
      };
    }

    public string edgeId;
  }

  internal struct SetLayerFields {
    public static void dispatch(JObject jobj) {
      Dictionary<string, string> fieldValues = new Dictionary<string, string>();

      foreach (var fieldEntry in (jobj["fieldValues"] as JObject).Properties()) {
        fieldValues[fieldEntry.Name] = fieldEntry.Value.ToString();
      }
      
      SetLayerFields setLayerFieldsReq = new SetLayerFields {
        layerId = jobj["layerId"].ToString(),
        fieldValues = fieldValues
      };
    }

    public string layerId;
    public Dictionary<string, string> fieldValues;
  }
}
#pragma warning restore 0649
