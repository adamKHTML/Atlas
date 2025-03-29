<?php

namespace App\Entity;

use App\Repository\DiscussionRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: DiscussionRepository::class)]
class Discussion
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $title = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $created_at = null;

    #[ORM\ManyToOne(inversedBy: 'Discussion')]
    private ?Country $country = null;

    /**
     * @var Collection<int, Message>
     */
    #[ORM\OneToMany(targetEntity: Message::class, mappedBy: 'discussion')]
    private Collection $Message;

    /**
     * @var Collection<int, Analytics>
     */
    #[ORM\OneToMany(targetEntity: Analytics::class, mappedBy: 'Discussion')]
    private Collection $analytics;

    public function __construct()
    {
        $this->Message = new ArrayCollection();
        $this->analytics = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(string $title): static
    {
        $this->title = $title;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->created_at;
    }

    public function setCreatedAt(\DateTimeImmutable $created_at): static
    {
        $this->created_at = $created_at;

        return $this;
    }

    public function getCountry(): ?Country
    {
        return $this->country;
    }

    public function setCountry(?Country $country): static
    {
        $this->country = $country;

        return $this;
    }

    /**
     * @return Collection<int, Message>
     */
    public function getMessage(): Collection
    {
        return $this->Message;
    }

    public function addMessage(Message $message): static
    {
        if (!$this->Message->contains($message)) {
            $this->Message->add($message);
            $message->setDiscussion($this);
        }

        return $this;
    }

    public function removeMessage(Message $message): static
    {
        if ($this->Message->removeElement($message)) {
            // set the owning side to null (unless already changed)
            if ($message->getDiscussion() === $this) {
                $message->setDiscussion(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Analytics>
     */
    public function getAnalytics(): Collection
    {
        return $this->analytics;
    }

    public function addAnalytic(Analytics $analytic): static
    {
        if (!$this->analytics->contains($analytic)) {
            $this->analytics->add($analytic);
            $analytic->setDiscussion($this);
        }

        return $this;
    }

    public function removeAnalytic(Analytics $analytic): static
    {
        if ($this->analytics->removeElement($analytic)) {
            // set the owning side to null (unless already changed)
            if ($analytic->getDiscussion() === $this) {
                $analytic->setDiscussion(null);
            }
        }

        return $this;
    }
}
