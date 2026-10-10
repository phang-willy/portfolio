package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.exception.ApiException;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Set;
import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilderFactory;
import org.springframework.http.HttpStatus;
import org.w3c.dom.Element;
import org.w3c.dom.NamedNodeMap;
import org.w3c.dom.Node;
import org.xml.sax.ErrorHandler;
import org.xml.sax.InputSource;
import org.xml.sax.SAXException;
import org.xml.sax.SAXParseException;

/**
 * Stack logos are pasted inline SVG, stored as text, and rendered in the admin.
 * The markup is parsed so character references are decoded before the allowlist runs.
 * Project image uploads are a separate path and do not accept SVG.
 */
public final class StackSvgPolicy {

  private static final String INVALID_SVG_CODE = "INVALID_SVG";
  private static final String INVALID_SVG_MESSAGE = "Stack icon must be a static inline SVG";
  private static final Set<String> ALLOWED_ELEMENTS = Set.of(
    "svg",
    "g",
    "path",
    "circle",
    "ellipse",
    "rect",
    "line",
    "polyline",
    "polygon",
    "title",
    "desc",
    "defs",
    "lineargradient",
    "radialgradient",
    "stop",
    "clippath",
    "mask",
    "symbol",
    "use",
    "text",
    "tspan",
    "a"
  );
  private static final Set<String> URL_ATTRIBUTES = Set.of("href", "src");

  private static final ErrorHandler SILENT_ERRORS = new ErrorHandler() {
    @Override
    public void warning(SAXParseException exception) {
    }

    @Override
    public void error(SAXParseException exception) {
    }

    @Override
    public void fatalError(SAXParseException exception) throws SAXException {
      throw exception;
    }
  };

  private StackSvgPolicy() {
  }

  public static String normalize(String image) {
    if (image == null) {
      return null;
    }

    String trimmed = image.trim();
    if (trimmed.isEmpty()) {
      return null;
    }

    Element root = parse(trimmed);
    if (!"svg".equals(localName(root))) {
      throw invalid();
    }
    validate(root);
    return trimmed;
  }

  private static Element parse(String markup) {
    try {
      DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
      factory.setNamespaceAware(true);
      factory.setExpandEntityReferences(false);
      factory.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);
      factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
      factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
      factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
      var builder = factory.newDocumentBuilder();
      builder.setErrorHandler(SILENT_ERRORS);
      var document = builder.parse(new InputSource(
        new ByteArrayInputStream(markup.getBytes(StandardCharsets.UTF_8))
      ));
      Element root = document.getDocumentElement();
      if (root == null) {
        throw invalid();
      }
      return root;
    } catch (ApiException exception) {
      throw exception;
    } catch (Exception exception) {
      throw invalid();
    }
  }

  private static void validate(Element element) {
    if (!ALLOWED_ELEMENTS.contains(localName(element))) {
      throw invalid();
    }

    NamedNodeMap attributes = element.getAttributes();
    for (int index = 0; index < attributes.getLength(); index++) {
      validateAttribute(attributes.item(index));
    }

    for (Node child = element.getFirstChild(); child != null; child = child.getNextSibling()) {
      if (child instanceof Element childElement) {
        validate(childElement);
      }
    }
  }

  private static void validateAttribute(Node attribute) {
    String name = attributeName(attribute);
    String value = attribute.getNodeValue() == null ? "" : attribute.getNodeValue();
    if (name.startsWith("on") || containsActiveUrl(value)) {
      throw invalid();
    }
    if (URL_ATTRIBUTES.contains(name) && !isInternalReference(value)) {
      throw invalid();
    }
  }

  private static boolean isInternalReference(String value) {
    String normalized = value.trim().replaceAll("\\s+", "");
    return normalized.isEmpty() || normalized.startsWith("#");
  }

  private static boolean containsActiveUrl(String value) {
    String normalized = value.toLowerCase(Locale.ROOT).replaceAll("\\s+", "");
    return normalized.contains("javascript:")
      || normalized.contains("data:text/html")
      || normalized.contains("url(") && !normalized.contains("url(#");
  }

  private static String localName(Element element) {
    String local = element.getLocalName();
    String name = local == null || local.isBlank() ? element.getNodeName() : local;
    return name.toLowerCase(Locale.ROOT);
  }

  private static String attributeName(Node attribute) {
    String local = attribute.getLocalName();
    String name = local == null || local.isBlank() ? attribute.getNodeName() : local;
    int colon = name.indexOf(':');
    if (colon >= 0) {
      name = name.substring(colon + 1);
    }
    return name.toLowerCase(Locale.ROOT);
  }

  private static ApiException invalid() {
    return new ApiException(HttpStatus.BAD_REQUEST, INVALID_SVG_CODE, INVALID_SVG_MESSAGE);
  }
}
