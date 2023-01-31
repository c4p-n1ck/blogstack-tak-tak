"use client";

import { SlNote } from "react-icons/sl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BlogContext } from "./context/blog-provider";
import { useContext, useState } from "react";
import { useNostr } from "nostr-react";
import { useRouter } from "next/navigation";
import { NostrService } from "./lib/nostr";
import { KeysContext } from "./context/keys-provider.jsx";
import { nip19 } from "nostr-tools";
import Button from "./Button";
import Popup from "./Popup";
import CreatableSelect from 'react-select/creatable';

const WriteButton = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [tagsList, setTagsList] = useState<{label: string, value: string;}[]>([]);

  // @ts-ignore
  const { blog } = useContext(BlogContext);

  // @ts-ignore
  const { keys } = useContext(KeysContext);
  const { publish } = useNostr();
  // const { connectedRelays } = useNostr();
  const publicKey = keys?.publicKey;

  const setNoOptionsMessage = () => {
    return "No Options";
  };

  const handleSetTagsList = (list: any) => {
    if (list.length > 5) {
      return;
    }
    setTagsList(list);
  };

  const handlePublish = async () => {
    setIsOpen(true);
  };

  const submitPublish = async () => {
    const { title, text } = blog;

    const tags = [
      ["client", "blogstack.io"],
      ["subject", title],
    ];

    for (let tagValue of tagsList) {
      tags.push(['t', tagValue.value]);
    }

    let event = NostrService.createEvent(2222, publicKey, text, tags);

    try {
      event = await NostrService.addEventData(event);
    } catch (err: any) {
      return;
    }

    let eventId: any = null;
    eventId = event?.id;

    const pubs = publish(event);

    // @ts-ignore
    for await (const pub of pubs) {
      pub.on("ok", () => {
        console.log("OUR EVENT WAS ACCEPTED");
      });

      await pub.on("seen", async () => {
        console.log("OUR EVENT WAS SEEN");
        router.push("/u/" + nip19.npubEncode(publicKey));
      });

      pub.on("failed", (reason: any) => {
        console.log("OUR EVENT HAS FAILED WITH REASON:", reason);
      });
    }
  };

  return (
    <>
      {pathname === "/write" ? (
        <>
          <Button size="sm" color="green" onClick={handlePublish}>
            Publish
          </Button>
          <Popup
            title="Add Tags"
            isOpen={isOpen}
            setIsOpen={setIsOpen}
          >
            <small>Add topics (up to 5)</small>
            <CreatableSelect isMulti noOptionsMessage={setNoOptionsMessage} value={tagsList} isOptionDisabled={() => tagsList.length >= 5} options={[]} onChange={handleSetTagsList}/>;
            <Button size="sm" color="green" onClick={submitPublish}>
              Publish Now
            </Button>
          </Popup>
        </>
      ) : (
        <Link
          className="flex gap-2 text-gray hover:text-gray-hover"
          href="/write"
        >
          <SlNote size="20" />
          <span className="text-sm">Write</span>
        </Link>
      )}
    </>
  );
};

export default WriteButton;
