import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import setCustomMarkdown from "./setCustomMarkdown";

const customNotionToMarkdown = (notionClient: Client): NotionToMarkdown => {
  const n2m = new NotionToMarkdown({ notionClient });
  const custom_n2m = setCustomMarkdown(n2m)
  return custom_n2m
}


export default customNotionToMarkdown